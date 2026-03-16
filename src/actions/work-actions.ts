'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';

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
  const prismaWork = prisma as unknown as {
    orderItem: {
      findUnique(args: unknown): Promise<{
        id: string;
        orderId: string;
        total: { toString(): string };
      } | null>;
    };
    workAssignment: {
      deleteMany(args: unknown): Promise<unknown>;
      upsert(args: unknown): Promise<unknown>;
    };
  };

  const orderId = String(formData.get('orderId') ?? '');
  const orderItemId = String(formData.get('orderItemId') ?? '');
  const taskTypeRaw = String(formData.get('taskType') ?? '');
  const employeeId = String(formData.get('employeeId') ?? '');

  const taskType = parseTaskType(taskTypeRaw);
  if (!orderId || !orderItemId || !taskType) {
    return;
  }

  const percentNumber = taskPercents[taskType];
  if (percentNumber <= 0) {
    return;
  }

  const orderItem = await prismaWork.orderItem.findUnique({
    where: { id: orderItemId },
    select: { id: true, orderId: true, total: true },
  });

  if (!orderItem || orderItem.orderId !== orderId) {
    return;
  }

  if (!employeeId) {
    await prismaWork.workAssignment.deleteMany({
      where: {
        orderItemId,
        taskType,
      },
    });

    revalidatePath(`/orders/${orderId}`);
    return;
  }

  const total = Number(orderItem.total.toString());
  const amountNumber = Math.max((total * percentNumber) / 100, 0);

  await prismaWork.workAssignment.upsert({
    where: {
      orderItemId_taskType: {
        orderItemId,
        taskType,
      },
    },
    create: {
      orderId,
      orderItemId,
      employeeId,
      taskType,
      percent: percentNumber.toFixed(2),
      amount: amountNumber.toFixed(2),
    },
    update: {
      employeeId,
      percent: percentNumber.toFixed(2),
      amount: amountNumber.toFixed(2),
    },
  });

  revalidatePath(`/orders/${orderId}`);
}
