'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { backendFetch } from '@/lib/backend';
import { haversineDistanceKm, nearestNeighborOrder } from '@/lib/geo';

function parseJsonArray(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseDate(value: unknown) {
  const raw = typeof value === 'string' ? value : '';
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumber(value: unknown) {
  if (typeof value !== 'string') return null;
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function createDeliveryPlanAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const plannedDate = parseDate(formData.get('plannedDate'));
  const startAddress =
    String(formData.get('startAddress') ?? '').trim() || null;
  const startLat = parseNumber(formData.get('startLat'));
  const startLng = parseNumber(formData.get('startLng'));
  const customerIds = parseJsonArray(formData.get('customerIds')).filter(
    (v) => typeof v === 'string',
  );

  if (
    !name ||
    !plannedDate ||
    customerIds.length === 0 ||
    startLat == null ||
    startLng == null
  ) {
    redirect('/delivery-planning/new?error=Input%20tidak%20valid');
  }

  const customersPaged = await backendFetch<{
    items: Array<{
      id: string;
      name: string;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
    }>;
  }>(`/api/v1/customers?page=1&pageSize=500&q=`).catch(() => ({ items: [] }));

  const customerSet = new Set(customerIds);
  const customers = customersPaged.items
    .filter((c) => customerSet.has(c.id))
    .filter((c) => c.latitude != null && c.longitude != null);

  if (customers.length === 0) {
    redirect(
      '/delivery-planning/new?error=Semua%20pelanggan%20belum%20punya%20koordinat',
    );
  }

  const start = { lat: startLat, lng: startLng };
  const points = customers.map((c) => ({
    customerId: c.id,
    name: c.name,
    address: c.address,
    location: { lat: Number(c.latitude), lng: Number(c.longitude) },
  }));

  const ordered = nearestNeighborOrder(start, points);

  const stops = ordered.map((p, index) => {
    const prev = index === 0 ? start : ordered[index - 1].location;
    const distanceKm = haversineDistanceKm(prev, p.location);
    return {
      customerId: p.customerId,
      sequence: index + 1,
      distanceKm,
    };
  });

  const created = await backendFetch<{ id: string }>(`/api/v1/delivery-plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      plannedDate: plannedDate.toISOString().slice(0, 10),
      startAddress,
      startLat,
      startLng,
      stops: stops.map((s) => ({
        customerId: s.customerId,
        sequence: s.sequence,
        distanceKm: Number.isFinite(s.distanceKm) ? s.distanceKm : 0,
      })),
    }),
  }).catch(() => null);

  if (!created?.id) {
    redirect('/delivery-planning/new?error=Gagal%20membuat%20rencana');
  }

  revalidatePath('/delivery-planning');
  redirect(`/delivery-planning/${created.id}`);
}
