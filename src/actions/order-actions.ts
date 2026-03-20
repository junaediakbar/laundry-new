'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { orderSchema, paymentSchema } from '@/lib/validations';

function parseDateOnly(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function generateInvoiceNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${`${now.getMonth() + 1}`.padStart(2, '0')}${`${now.getDate()}`.padStart(2, '0')}`;
  const prefix = `LDR-${datePart}-`;
  const count = await prisma.order.count({
    where: { invoiceNumber: { startsWith: prefix } },
  });
  const sequence = `${count + 1}`.padStart(3, '0');
  return `${prefix}${sequence}`;
}

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

  const itemsWithTotal = parsed.data.items.map((item) => {
    const total = item.quantity * item.unitPrice - item.discount;
    return { ...item, total: total < 0 ? 0 : total };
  });
  const total = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);
  const invoiceNumber = await generateInvoiceNumber();

  const receivedDate =
    typeof parsed.data.receivedDate === 'string'
      ? (parseDateOnly(parsed.data.receivedDate) ?? new Date())
      : new Date();

  const completedDate =
    typeof parsed.data.completedDate === 'string'
      ? parseDateOnly(parsed.data.completedDate)
      : null;

  const order = await prisma.order.create({
    data: {
      invoiceNumber,
      customerId: parsed.data.customerId,
      total,
      receivedDate,
      completedDate,
      note: parsed.data.note || null,
      items: {
        create: itemsWithTotal.map((item) => ({
          serviceTypeId: item.serviceTypeId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: item.total,
        })),
      },
    },
  });

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

  const data =
    workflowStatus === 'picked_up'
      ? { workflowStatus: 'picked_up' as const, pickupDate: new Date() }
      : workflowStatus === 'finished'
        ? {
            workflowStatus: 'finished' as const,
            pickupDate: null,
            completedDate: new Date(),
          }
        : {
            workflowStatus: workflowStatus as
              | 'received'
              | 'washing'
              | 'drying'
              | 'ironing',
            pickupDate: null,
            completedDate: null,
          };

  await prisma.order.update({
    where: { id: orderId },
    data,
  });

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

  await prisma.payment.create({
    data: {
      orderId: parsed.data.orderId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      note: parsed.data.note || null,
    },
  });

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { payments: true },
  });

  if (!order) {
    redirect('/orders');
  }

  const paidAmount = order.payments.reduce(
    (sum: number, item: { amount: { toString(): string } }) =>
      sum + Number(item.amount.toString()),
    0,
  );
  const orderTotal = Number(order.total);

  const paymentStatus =
    paidAmount >= orderTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
  await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: { paymentStatus },
  });

  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath('/orders');
}
