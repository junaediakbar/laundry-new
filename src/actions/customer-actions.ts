'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { backendFetch } from '@/lib/backend';
import { customerSchema } from '@/lib/validations';

function parseGoogleMapsLatLng(input: string | null | undefined) {
  const raw = (input ?? '').trim();
  if (!raw)
    return {
      latitude: null as number | null,
      longitude: null as number | null,
    };

  const cleaned = raw.replace(/\s/g, '');

  const qMatch = cleaned.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (qMatch) {
    return { latitude: Number(qMatch[1]), longitude: Number(qMatch[2]) };
  }

  const queryMatch = cleaned.match(
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,
  );
  if (queryMatch) {
    return {
      latitude: Number(queryMatch[1]),
      longitude: Number(queryMatch[2]),
    };
  }

  const atMatch = cleaned.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };
  }

  const plainMatch = cleaned.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
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

  const customer = await backendFetch<{ id: string }>('/api/v1/customers', {
    method: 'POST',
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
  }).catch(() => null);

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
  ).catch(() => null);

  if (!updated) {
    redirect(`/customers/${customerId}/edit`);
  }

  revalidatePath('/customers');
  redirect(`/customers/${customerId}`);
}
