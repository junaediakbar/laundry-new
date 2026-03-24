'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { backendFetch } from '@/lib/backend';
import { employeeSchema } from '@/lib/validations';

export async function createEmployeeAction(formData: FormData) {
  const parsed = employeeSchema.safeParse({
    name: formData.get('name'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success) {
    redirect('/employees/new');
  }

  await backendFetch('/api/v1/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: parsed.data.name,
      isActive: parsed.data.isActive,
    }),
  }).catch(() => null);

  revalidatePath('/employees');
  redirect('/employees');
}

export async function updateEmployeeAction(employeeId: string, formData: FormData) {
  const parsed = employeeSchema.safeParse({
    name: formData.get('name'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success) {
    redirect(`/employees/${employeeId}/edit`);
  }

  await backendFetch(`/api/v1/employees/${employeeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: parsed.data.name,
      isActive: parsed.data.isActive,
    }),
  }).catch(() => null);

  revalidatePath('/employees');
  redirect('/employees');
}


export async function deleteEmployeeAction(employeeId: string) {
  await backendFetch(`/api/v1/employees/${employeeId}`, { method: 'DELETE' }).catch(() => null);
  revalidatePath('/employees');
  redirect('/employees');
}
