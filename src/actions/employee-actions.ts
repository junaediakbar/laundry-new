'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { backendFetch, BackendFetchError } from '@/lib/backend';
import { teamMemberSchema, updateTeamMemberSchema } from '@/lib/validations';

export async function createTeamMemberAction(formData: FormData) {
  const parsed = teamMemberSchema.safeParse({
    name: formData.get('name'),
    isActive: formData.get('isActive'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  });

  if (!parsed.success) {
    redirect('/employees/new');
  }

  await backendFetch('/api/v1/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    }),
  }).catch(() => null);

  revalidatePath('/employees');
  redirect('/employees?saved=1');
}

export async function updateTeamMemberAction(employeeId: string, formData: FormData) {
  const parsed = updateTeamMemberSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    isActive: formData.get('isActive'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    redirect(`/employees/${employeeId}/edit`);
  }

  const body: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    isActive: parsed.data.isActive,
  };
  const pw = (parsed.data.password ?? '').trim();
  if (pw.length > 0) {
    body.password = pw;
  }

  await backendFetch(`/api/v1/employees/${employeeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);

  revalidatePath('/employees');
  redirect('/employees?saved=1');
}

export async function deleteEmployeeAction(employeeId: string) {
  try {
    await backendFetch(`/api/v1/employees/${employeeId}`, { method: 'DELETE' });
  } catch (err) {
    const message = err instanceof BackendFetchError ? err.message : 'Gagal menghapus karyawan';
    redirect(`/employees/${employeeId}/edit?error=${encodeURIComponent(message)}`);
  }
  revalidatePath('/employees');
  redirect('/employees');
}
