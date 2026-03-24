'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { BackendFetchError, backendFetch } from '@/lib/backend';
import { parseGoogleMapsPoiLatLng } from '@/lib/google-maps-url';
import { customerSchema } from '@/lib/validations';

export async function createCustomerAction(formData: FormData) {
  const parsed = customerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    mapsLink: formData.get('mapsLink'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) {
    redirect('/customers/new');
  }

  const coords = parseGoogleMapsPoiLatLng(parsed.data.mapsLink);
  const mapsLinkRaw = (parsed.data.mapsLink ?? '').trim();
  if (mapsLinkRaw && (coords.latitude == null || coords.longitude == null)) {
    redirect(
      '/customers/new?error=Link%20Maps%20tidak%20valid.%20Tempel%20URL%20lengkap%20dari%20halaman%20tempat%20di%20Google%20Maps%2C%20atau%20koordinat%20lat%2Clng.',
    );
  }

  const payload = {
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    latitude: coords.latitude,
    longitude: coords.longitude,
    notes: parsed.data.notes || null,
    name: parsed.data.name,
  };

  const customer = await backendFetch<{ id: string }>('/api/v1/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((e) => {
    console.error('createCustomerAction error', {
      message: e instanceof Error ? e.message : String(e),
      payload,
    });
    return null;
  });

  if (!customer) {
    redirect('/customers/new');
  }

  revalidatePath('/customers');
  redirect(`/customers/${customer.id}?created=1`);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateCustomerAction(
  customerId: string,
  formData: FormData,
) {
  const parsed = customerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    mapsLink: formData.get('mapsLink'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) {
    redirect(`/customers/${customerId}/edit`);
  }

  const coords = parseGoogleMapsPoiLatLng(parsed.data.mapsLink);
  const mapsLinkRaw = (parsed.data.mapsLink ?? '').trim();
  if (mapsLinkRaw && (coords.latitude == null || coords.longitude == null)) {
    redirect(
      `/customers/${customerId}/edit?error=Link%20Maps%20tidak%20valid.%20Tempel%20URL%20lengkap%20dari%20halaman%20tempat%20di%20Google%20Maps%2C%20atau%20koordinat%20lat%2Clng.`,
    );
  }

  const updated = await backendFetch<{ id: string }>(
    `/api/v1/customers/${customerId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        latitude: coords.latitude,
        longitude: coords.longitude,
        notes: parsed.data.notes || null,
        name: parsed.data.name,
      }),
    },
  ).catch((e) => {
    console.error('updateCustomerAction error', {
      message: e instanceof Error ? e.message : String(e),
      customerId,
    });
    return null;
  });

  if (!updated) {
    redirect(`/customers/${customerId}/edit`);
  }

  revalidatePath('/customers');
  redirect(`/customers/${customerId}?saved=1`);
}

export async function deleteCustomerAction(customerId: string) {
  try {
    await backendFetch<{ ok: boolean }>(`/api/v1/customers/${customerId}`, {
      method: 'DELETE',
    });
  } catch (e) {
    if (e instanceof BackendFetchError) {
      redirect(
        `/customers/${customerId}?error=${encodeURIComponent(e.message)}`,
      );
    }
    redirect(
      `/customers/${customerId}?error=${encodeURIComponent('Gagal menghapus pelanggan')}`,
    );
  }
  revalidatePath('/customers');
  redirect('/customers');
}
