'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { haversineDistanceKm, nearestNeighborOrder } from '@/lib/geo';

type DeliveryTx = {
  deliveryPlan: {
    create(args: unknown): Promise<{ id: string }>;
  };
  deliveryStop: {
    createMany(args: unknown): Promise<unknown>;
  };
};

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

  const prismaDelivery = prisma as unknown as {
    customer: {
      findMany(args: unknown): Promise<
        Array<{
          id: string;
          name: string;
          address: string | null;
          latitude: { toString(): string } | number | null;
          longitude: { toString(): string } | number | null;
        }>
      >;
    };
    deliveryPlan: {
      create(args: unknown): Promise<{ id: string }>;
    };
    deliveryStop: {
      createMany(args: unknown): Promise<unknown>;
    };
    $transaction<T>(cb: (tx: DeliveryTx) => Promise<T>): Promise<T>;
  };

  const customers = await prismaDelivery.customer.findMany({
    where: {
      id: { in: customerIds },
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
    },
  });

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
      customer_id: p.customerId,
      sequence: index + 1,
      distance_km: distanceKm.toFixed(2),
    };
  });

  const planId = await prismaDelivery.$transaction(async (tx) => {
    const created = await tx.deliveryPlan.create({
      data: {
        name,
        plannedDate,
        startAddress,
        startLat: startLat.toFixed(6),
        startLng: startLng.toFixed(6),
      },
      select: { id: true },
    });

    await tx.deliveryStop.createMany({
      data: stops.map((s) => ({
        planId: created.id,
        customerId: s.customer_id,
        sequence: s.sequence,
        distanceKm: s.distance_km,
      })),
    });

    return created.id as string;
  });

  revalidatePath('/delivery-planning');
  redirect(`/delivery-planning/${planId}`);
}
