'use server';

import { revalidatePath } from 'next/cache';

import { BackendFetchError, backendFetch } from '@/lib/backend';

function parseTaskType(value: string): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return raw;
}

export async function upsertWorkAssignmentAction(formData: FormData) {
  const orderId = String(formData.get('orderId') ?? '');
  const orderItemId = String(formData.get('orderItemId') ?? '');
  const taskTypeRaw = String(formData.get('taskType') ?? '');
  const employeeId = String(formData.get('employeeId') ?? '');
  const percentRaw = String(formData.get('percent') ?? '');

  const taskType = parseTaskType(taskTypeRaw);
  if (!orderId || !orderItemId || !taskType) {
    throw new Error('Data work assignment tidak valid');
  }

  const percent = (() => {
    const n = Number(percentRaw);
    return Number.isFinite(n) ? n : null;
  })();

  try {
    await backendFetch(
      `/api/v1/orders/${orderId}/items/${orderItemId}/work-assignments/${encodeURIComponent(taskType)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          ...(employeeId.trim() && percent && percent > 0 ? { percent } : {}),
        }),
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
