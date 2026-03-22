'use server';

import { revalidatePath } from 'next/cache';

import { backendFetch } from '@/lib/backend';

type WorkTaskType =
  | 'pickup'
  | 'dropoff'
  | 'fuel_vehicle'
  | 'driver'
  | 'dust_removal'
  | 'brushing'
  | 'rinse_sprayer'
  | 'spin_dry'
  | 'finishing_packing';

const taskPercents: Record<WorkTaskType, number> = {
  pickup: 5,
  dropoff: 5,
  fuel_vehicle: 5,
  driver: 5,
  dust_removal: 5,
  brushing: 5,
  rinse_sprayer: 5,
  spin_dry: 5,
  finishing_packing: 10,
};

function parseTaskType(value: string): WorkTaskType | null {
  return value in taskPercents ? (value as WorkTaskType) : null;
}

export async function upsertWorkAssignmentAction(formData: FormData) {
  const orderId = String(formData.get('orderId') ?? '');
  const orderItemId = String(formData.get('orderItemId') ?? '');
  const taskTypeRaw = String(formData.get('taskType') ?? '');
  const employeeId = String(formData.get('employeeId') ?? '');

  const taskType = parseTaskType(taskTypeRaw);
  if (!orderId || !orderItemId || !taskType) {
    return;
  }

  await backendFetch(
    `/api/v1/orders/${orderId}/items/${orderItemId}/work-assignments/${taskType}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    },
  ).catch(() => null);

  revalidatePath(`/orders/${orderId}`);
}
