'use server';

import { revalidatePath } from 'next/cache';

import { BackendFetchError, backendFetch } from '@/lib/backend';

type WorkTaskType =
  | 'pickup_fuel'
  | 'pickup_driver'
  | 'pickup_worker_1'
  | 'pickup_worker_2'
  | 'dropoff_fuel'
  | 'dropoff_driver'
  | 'dropoff_worker_1'
  | 'dropoff_worker_2'
  | 'dust_removal'
  | 'brushing'
  | 'rinse_sprayer'
  | 'spin_dry'
  | 'finishing_packing';

const taskPercents: Record<WorkTaskType, number> = {
  pickup_fuel: 2.5,
  pickup_driver: 2.5,
  pickup_worker_1: 2.5,
  pickup_worker_2: 2.5,
  dropoff_fuel: 2.5,
  dropoff_driver: 2.5,
  dropoff_worker_1: 2.5,
  dropoff_worker_2: 2.5,
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
    throw new Error('Data work assignment tidak valid');
  }

  try {
    await backendFetch(
      `/api/v1/orders/${orderId}/items/${orderItemId}/work-assignments/${taskType}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      },
    );
  } catch (e) {
    if (e instanceof BackendFetchError) {
      if (e.status === 401) throw new Error('Sesi habis. Silakan login ulang.');
      throw new Error(e.message);
    }
    if (e instanceof Error && e.message.trim()) throw new Error(e.message);
    throw new Error('Gagal menyimpan performa karyawan');
  }

  revalidatePath(`/orders/${orderId}`);
}
