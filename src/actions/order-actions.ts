'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { BackendFetchError, backendFetch } from '@/lib/backend';
import {
  deletePaymentSchema,
  orderSchema,
  paymentSchema,
} from '@/lib/validations';

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
  const upload = new FormData();
  upload.set('customerId', parsed.data.customerId);
  upload.set('receivedDate', parsed.data.receivedDate || '');
  upload.set('completedDate', parsed.data.completedDate || '');
  upload.set('note', parsed.data.note || '');
  upload.set(
    'items',
    typeof itemsRaw === 'string' ? itemsRaw : JSON.stringify(parsed.data.items),
  );
  for (const file of imageFiles) {
    upload.append('images', file);
  }

  try {
    await backendFetch<{ id: string }>('/api/v1/orders', {
      method: 'POST',
      body: upload,
    });
  } catch (e) {
    if (e instanceof BackendFetchError) {
      console.error('createOrderAction backend error', {
        status: e.status,
        code: e.code,
        message: e.message,
        details: e.details,
        payload: {
          customerId: parsed.data.customerId,
          receivedDate: parsed.data.receivedDate || null,
          completedDate: parsed.data.completedDate || null,
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
          receivedDate: parsed.data.receivedDate || null,
          completedDate: parsed.data.completedDate || null,
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
    'washing',
    'drying',
    'ironing',
    'finished',
    'picked_up',
  ];
  if (!allowed.includes(workflowStatus)) {
    return;
  }

  await backendFetch<{ ok: boolean }>(`/api/v1/orders/${orderId}/workflow`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowStatus }),
  }).catch(() => null);

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
