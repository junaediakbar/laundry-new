'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { BackendFetchError, backendFetch } from '@/lib/backend';
import { haversineDistanceKm, nearestNeighborOrderWithEnd } from '@/lib/geo';
import { parseGoogleMapsPoiLatLng } from '@/lib/google-maps-url';

const DEFAULT_START_MAP_LINK =
  'https://www.google.com/maps/place/3+Trees+Fotocopy/@-0.8803799,119.8737962,17z/data=!3m1!4b1!4m6!3m5!1s0x2d8bec2e9c74ab8d:0x3cfd3cd0152d041!8m2!3d-0.8803799!4d119.8737962!16s%2Fg%2F11c57xrtsh?entry=ttu&g_ep=EgoyMDI2MDMxOC4xIKXMDSoASAFQAw%3D%3D';

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

export async function createDeliveryPlanAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const plannedDate = parseDate(formData.get('plannedDate'));
  const startAddress =
    String(formData.get('startAddress') ?? '').trim() || null;
  const startMapsLink =
    String(formData.get('startMapsLink') ?? '').trim() || DEFAULT_START_MAP_LINK;
  const endAddress = String(formData.get('endAddress') ?? '').trim() || null;
  const endMapsLink =
    String(formData.get('endMapsLink') ?? '').trim() || startMapsLink;
  const startFromMaps = parseGoogleMapsPoiLatLng(startMapsLink);
  const endFromMaps = parseGoogleMapsPoiLatLng(endMapsLink);
  const startLat = startFromMaps.latitude;
  const startLng = startFromMaps.longitude;
  const endLat = endFromMaps.latitude;
  const endLng = endFromMaps.longitude;
  const customerIds = parseJsonArray(formData.get('customerIds')).filter(
    (v) => typeof v === 'string',
  );

  if (
    !name ||
    !plannedDate ||
    customerIds.length === 0 ||
    startLat == null ||
    startLng == null ||
    endLat == null ||
    endLng == null
  ) {
    redirect(
      '/delivery-planning/new?error=Input%20tidak%20valid.%20Link%20Google%20Maps%20titik%20awal/akhir%20wajib%20valid.',
    );
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
  const end = { lat: endLat, lng: endLng };
  const points = customers.map((c) => ({
    customerId: c.id,
    name: c.name,
    address: c.address,
    location: { lat: Number(c.latitude), lng: Number(c.longitude) },
  }));

  const ordered = nearestNeighborOrderWithEnd(start, end, points);

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
      endAddress,
      endLat,
      endLng,
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
  redirect('/delivery-planning?created=1');
}

export async function deleteDeliveryPlanAction(planId: string) {
  try {
    await backendFetch(`/api/v1/delivery-plans/${planId}`, {
      method: 'DELETE',
    });
  } catch (e) {
    if (e instanceof BackendFetchError) {
      redirect(`/delivery-planning?error=${encodeURIComponent(e.message)}`);
    }
    redirect('/delivery-planning?error=Gagal%20menghapus%20rencana');
  }
  revalidatePath('/delivery-planning');
  redirect('/delivery-planning');
}
