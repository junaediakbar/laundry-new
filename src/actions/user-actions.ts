'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { backendFetch } from '@/lib/backend';
import { userSchema } from '@/lib/validations';

export async function createUserAction(formData: FormData) {
  const parsed = userSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success || !parsed.data.password) {
    redirect('/users/new');
  }

  await backendFetch('/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      password: parsed.data.password,
      isActive: parsed.data.isActive,
    }),
  }).catch(() => null);

  revalidatePath('/users');
  redirect('/users');
}

export async function updateUserAction(userId: string, formData: FormData) {
  const parsed = userSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success) {
    redirect(`/users/${userId}/edit`);
  }

  const body: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    isActive: parsed.data.isActive,
  };
  if (parsed.data.password && parsed.data.password.length > 0) {
    body.password = parsed.data.password;
  }

  await backendFetch(`/api/v1/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);

  revalidatePath('/users');
  redirect('/users');
}

export async function deleteUserAction(userId: string) {
  await backendFetch(`/api/v1/users/${userId}`, { method: 'DELETE' }).catch(() => null);
  revalidatePath('/users');
  redirect('/users');
}

