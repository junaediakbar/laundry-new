'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { BackendFetchError, backendFetch } from '@/lib/backend';
import { customerSchema } from '@/lib/validations';

function parseGoogleMapsLatLng(input: string | null | undefined) {
  const raw = (input ?? '').trim();
  if (!raw)
    return {
      latitude: null as number | null,
      longitude: null as number | null,
    };

  const cleaned = raw.replace(/\s/g, '');
  const decoded = (() => {
    try {
      return decodeURIComponent(cleaned);
    } catch {
      return cleaned;
    }
  })();

  const qMatch = decoded.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (qMatch) {
    return { latitude: Number(qMatch[1]), longitude: Number(qMatch[2]) };
  }

  const queryMatch = decoded.match(
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,
  );
  if (queryMatch) {
    return {
      latitude: Number(queryMatch[1]),
      longitude: Number(queryMatch[2]),
    };
  }

  const atMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };
  }

  const plainMatch = decoded.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (plainMatch) {
    return {
      latitude: Number(plainMatch[1]),
      longitude: Number(plainMatch[2]),
    };
  }

  return { latitude: null as number | null, longitude: null as number | null };
}

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

  const coords = parseGoogleMapsLatLng(parsed.data.mapsLink);
  const mapsLinkRaw = (parsed.data.mapsLink ?? '').trim();
  if (mapsLinkRaw && (coords.latitude == null || coords.longitude == null)) {
    redirect(
      '/customers/new?error=Link%20Maps%20tidak%20valid.%20Gunakan%20format%20yang%20mengandung%20latitude,longitude.',
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
  redirect(`/customers/${customer.id}`);
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

  const coords = parseGoogleMapsLatLng(parsed.data.mapsLink);
  const mapsLinkRaw = (parsed.data.mapsLink ?? '').trim();
  if (mapsLinkRaw && (coords.latitude == null || coords.longitude == null)) {
    redirect(
      `/customers/${customerId}/edit?error=Link%20Maps%20tidak%20valid.%20Gunakan%20format%20yang%20mengandung%20latitude,longitude.`,
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
  redirect(`/customers/${customerId}`);
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
