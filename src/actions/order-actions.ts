'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { backendFetch } from '@/lib/backend';
import { orderSchema, paymentSchema } from '@/lib/validations';

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
    redirect('/orders/new');
  }

  const order = await backendFetch<{ id: string }>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: parsed.data.customerId,
      receivedDate: parsed.data.receivedDate || null,
      completedDate: parsed.data.completedDate || null,
      note: parsed.data.note || null,
      items: parsed.data.items.map((item) => ({
        serviceTypeId: item.serviceTypeId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
    }),
  }).catch(() => null);

  if (!order) {
    redirect('/orders/new');
  }

  revalidatePath('/orders');
  redirect(`/orders/${order.id}`);
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
    redirect('/orders');
  }

  await backendFetch(`/api/v1/orders/${parsed.data.orderId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: parsed.data.amount,
      method: parsed.data.method,
      note: parsed.data.note || null,
    }),
  }).catch(() => null);

  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath('/orders');
}
