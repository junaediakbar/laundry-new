'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { backendFetch } from '@/lib/backend';
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

  await backendFetch('/api/v1/service-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: parsed.data.name,
      unit: parsed.data.unit,
      defaultPrice: parsed.data.defaultPrice,
      isActive: parsed.data.isActive,
    }),
  }).catch(() => null);

  revalidatePath('/service-types');
  redirect('/service-types?saved=1');
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

  await backendFetch(`/api/v1/service-types/${serviceTypeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: parsed.data.name,
      unit: parsed.data.unit,
      defaultPrice: parsed.data.defaultPrice,
      isActive: parsed.data.isActive,
    }),
  }).catch(() => null);

  revalidatePath('/service-types');
  redirect('/service-types?saved=1');
}


export async function deleteServiceTypeAction(serviceTypeId: string) {
  await backendFetch(`/api/v1/service-types/${serviceTypeId}`, { method: 'DELETE' }).catch(() => null);
  revalidatePath('/service-types');
  redirect('/service-types');
}
