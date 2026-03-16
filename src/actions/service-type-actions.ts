'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { serviceTypeSchema } from '@/lib/validations';

export async function createServiceTypeAction(formData: FormData) {
  const parsed = serviceTypeSchema.safeParse({
    name: formData.get('name'),
    unit: formData.get('unit'),
    defaultPrice: formData.get('defaultPrice'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success) {
    redirect('/service-types/new');
  }

  await prisma.serviceType.create({
    data: {
      name: parsed.data.name,
      unit: parsed.data.unit,
      defaultPrice: parsed.data.defaultPrice,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath('/service-types');
  redirect('/service-types');
}

export async function updateServiceTypeAction(
  serviceTypeId: string,
  formData: FormData,
) {
  const parsed = serviceTypeSchema.safeParse({
    name: formData.get('name'),
    unit: formData.get('unit'),
    defaultPrice: formData.get('defaultPrice'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success) {
    redirect(`/service-types/${serviceTypeId}/edit`);
  }

  await prisma.serviceType.update({
    where: { id: serviceTypeId },
    data: {
      name: parsed.data.name,
      unit: parsed.data.unit,
      defaultPrice: parsed.data.defaultPrice,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath('/service-types');
  redirect('/service-types');
}
