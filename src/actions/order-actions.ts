'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { BackendFetchError, backendFetch } from '@/lib/backend';
import {
  deletePaymentSchema,
  orderSchema,
  paymentSchema,
} from '@/lib/validations';

function normalizeWitaDateTimeInput(value: string | undefined) {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(raw)) return raw;

  const m = raw.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?$/);
  if (!m) return raw;

  const ymd = m[1];
  const hm = m[2];
  const ss = m[3] ?? '00';
  return `${ymd}T${hm}:${ss}+08:00`;
}

export async function createOrderAction(formData: FormData) {
  const itemsRaw = formData.get('items');
  const items =
    typeof itemsRaw === 'string' && itemsRaw.length > 0
      ? (() => {
          try {
            const parsed = JSON.parse(itemsRaw);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  const parsed = orderSchema.safeParse({
    customerId: formData.get('customerId'),
    receivedDate: formData.get('receivedDate'),
    completedDate: formData.get('completedDate'),
    items,
    note: formData.get('note'),
    pickupDelivery: formData.get('pickupDelivery'),
  });

  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ??
      'Data nota tidak valid. Periksa item, qty, dan harga.';
    redirect(`/orders/new?error=${encodeURIComponent(msg)}`);
  }

  const imageFiles = formData
    .getAll('images')
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 3);

  const receivedDate = normalizeWitaDateTimeInput(parsed.data.receivedDate);
  const completedDate = normalizeWitaDateTimeInput(parsed.data.completedDate);

  const upload = new FormData();
  upload.set('customerId', parsed.data.customerId);
  upload.set('receivedDate', receivedDate);
  upload.set('completedDate', completedDate);
  upload.set('note', parsed.data.note || '');
  const pd = parsed.data.pickupDelivery;
  if (pd === null) {
    upload.set('pickupDelivery', '');
  } else {
    upload.set('pickupDelivery', pd ? 'true' : 'false');
  }
  // Kirim item hasil parse Zod agar lengthM/widthM selaras dengan validasi (bukan string mentah form).
  upload.set('items', JSON.stringify(parsed.data.items));
  for (const file of imageFiles) {
    upload.append('images', file);
  }

  try {
    const orderResponse = await backendFetch<{
      id: string;
      items: Array<{ id: string }>;
    }>('/api/v1/orders', {
      method: 'POST',
      body: upload,
    });

    // Upload gambar per baris: indeks form harus sama dengan urutan item di response API.
    const itemCount = parsed.data.items.length;
    for (let i = 0; i < itemCount; i++) {
      const files = formData.getAll(`item-images-${i}`);
      const file = files.find((f): f is File => f instanceof File && f.size > 0);
      const orderItemId = orderResponse.items[i]?.id;
      if (!file || !orderItemId) continue;
      try {
        const itemImageUpload = new FormData();
        itemImageUpload.append('image', file);
        await backendFetch<{ imageUrl: string }>(
          `/api/v1/orders/items/${orderItemId}/image`,
          {
            method: 'POST',
            body: itemImageUpload,
          },
        );
      } catch (itemImageError) {
        console.error('Failed to upload item image', {
          itemIndex: i,
          orderItemId,
          error: itemImageError,
        });
      }
    }
  } catch (e) {
    if (e instanceof BackendFetchError) {
      console.error('createOrderAction backend error', {
        status: e.status,
        code: e.code,
        message: e.message,
        details: e.details,
        payload: {
          customerId: parsed.data.customerId,
          receivedDate: receivedDate || null,
          completedDate: completedDate || null,
          itemsCount: parsed.data.items.length,
          hasImage: imageFiles.length > 0,
          imageBytes: imageFiles.reduce((n, f) => n + f.size, 0),
        },
      });
      if (e.status === 401) redirect('/login?error=Silakan%20login%20ulang');
      redirect(`/orders/new?error=${encodeURIComponent(e.message)}`);
    }
    if (e instanceof Error) {
      console.error('createOrderAction error', {
        message: e.message,
        payload: {
          customerId: parsed.data.customerId,
          receivedDate: receivedDate || null,
          completedDate: completedDate || null,
          itemsCount: parsed.data.items.length,
        },
      });
      redirect(`/orders/new?error=${encodeURIComponent(e.message)}`);
    }
    console.error('createOrderAction unknown error', e);
    redirect('/orders/new?error=Gagal%20membuat%20nota');
  }

  revalidatePath('/orders');
  redirect('/orders?created=1');
}

export async function updateWorkflowAction(
  orderId: string,
  workflowStatus: string,
) {
  const allowed = [
    'received',
    'rontok_done',
    'jemur_done',
    'downy_done',
    'packing_done',
    'delivered',
    'picked_up',
    'washing',
    'drying',
    'ironing',
    'finished',
  ];
  if (!allowed.includes(workflowStatus)) {
    return;
  }

  try {
    await backendFetch<{ ok: boolean }>(
      `/api/v1/orders/${orderId}/workflow?workflowStatus=${encodeURIComponent(workflowStatus)}`,
      {
        method: 'PATCH',
      },
    );
  } catch (e) {
    if (e instanceof BackendFetchError) {
      if (e.status === 401) redirect('/login?error=Silakan%20login%20ulang');
      throw new Error(e.message);
    }
    throw new Error('Gagal mengubah status workflow');
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
}

export async function updatePickupDeliveryAction(
  orderId: string,
  pickupDelivery: boolean | null,
) {
  try {
    await backendFetch<{ ok: boolean }>(`/api/v1/orders/${orderId}/pickup-delivery`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickupDelivery }),
    });
  } catch (e) {
    if (e instanceof BackendFetchError) {
      if (e.status === 401) redirect('/login?error=Silakan%20login%20ulang');
      throw new Error(e.message);
    }
    throw new Error('Gagal menyimpan antar jemput');
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
}

export async function createPaymentAction(formData: FormData) {
  const parsed = paymentSchema.safeParse({
    orderId: formData.get('orderId'),
    amount: formData.get('amount'),
    method: formData.get('method'),
    note: formData.get('note'),
  });

  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ?? 'Data pembayaran tidak valid';
    throw new Error(msg);
  }

  try {
    await backendFetch(`/api/v1/orders/${parsed.data.orderId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parsed.data.amount,
        method: parsed.data.method,
        note: parsed.data.note || null,
      }),
    });
  } catch (e) {
    if (e instanceof BackendFetchError) {
      if (e.status === 401) {
        throw new Error('Sesi habis. Silakan login ulang.');
      }
      throw new Error(e.message);
    }
    throw new Error('Gagal menyimpan pembayaran');
  }

  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath('/orders');
}

export async function deletePaymentAction(formData: FormData) {
  const parsed = deletePaymentSchema.safeParse({
    orderId: formData.get('orderId'),
    paymentId: formData.get('paymentId'),
  });

  if (!parsed.success) {
    throw new Error('Data pembayaran tidak valid');
  }

  try {
    await backendFetch(
      `/api/v1/orders/${parsed.data.orderId}/payments/${parsed.data.paymentId}`,
      {
        method: 'DELETE',
      },
    );
  } catch (e) {
    if (e instanceof BackendFetchError) {
      if (e.status === 401) {
        throw new Error('Sesi habis. Silakan login ulang.');
      }
      if (e.status === 404 && /page not found/i.test(e.message)) {
        throw new Error(
          'Endpoint batalkan pembayaran belum tersedia di backend yang sedang berjalan. Restart backend (http://localhost:8080) dengan kode terbaru.',
        );
      }
      throw new Error(e.message);
    }
    throw new Error('Gagal membatalkan pembayaran');
  }

  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath('/orders');
}

export async function deleteOrderAction(orderId: string) {
  try {
    await backendFetch<{ ok: boolean }>(`/api/v1/orders/${orderId}`, {
      method: 'DELETE',
    });
  } catch (e) {
    if (e instanceof BackendFetchError) {
      redirect(`/orders/${orderId}?error=${encodeURIComponent(e.message)}`);
    }
    redirect(
      `/orders/${orderId}?error=${encodeURIComponent('Gagal menghapus nota')}`,
    );
  }
  revalidatePath('/orders');
  redirect('/orders');
}

export async function uploadOrderImagesAction(orderId: string, formData: FormData) {
  const files = formData
    .getAll('images')
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 3);

  if (files.length === 0) {
    return { ok: false as const, error: 'Pilih minimal satu file gambar.' };
  }

  const upload = new FormData();
  for (const file of files) {
    upload.append('images', file);
  }

  try {
    await backendFetch<{ ok: boolean }>(`/api/v1/orders/${orderId}/images`, {
      method: 'POST',
      body: upload,
    });
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');
    return { ok: true as const };
  } catch (e) {
    if (e instanceof BackendFetchError) {
      if (e.status === 401) {
        return { ok: false as const, error: 'Sesi habis. Silakan login ulang.' };
      }
      return { ok: false as const, error: e.message };
    }
    return { ok: false as const, error: 'Gagal mengunggah gambar.' };
  }
}

export async function uploadOrderItemImageAction(orderItemId: string, formData: FormData) {
  const file = formData.get('image');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: 'Pilih satu file gambar.' };
  }

  const upload = new FormData();
  upload.append('image', file);

  try {
    await backendFetch<{ imageUrl: string }>(`/api/v1/orders/items/${orderItemId}/image`, {
      method: 'POST',
      body: upload,
    });
    revalidatePath(`/orders`);
    return { ok: true as const };
  } catch (e) {
    if (e instanceof BackendFetchError) {
      if (e.status === 401) {
        return { ok: false as const, error: 'Sesi habis. Silakan login ulang.' };
      }
      return { ok: false as const, error: e.message };
    }
    return { ok: false as const, error: 'Gagal mengunggah gambar.' };
  }
}
