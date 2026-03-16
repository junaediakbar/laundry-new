'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { employeeSchema } from '@/lib/validations';

export async function createEmployeeAction(formData: FormData) {
  const prismaEmployee = prisma as unknown as {
    employee: {
      create(args: unknown): Promise<unknown>;
      update(args: unknown): Promise<unknown>;
    };
  };

  const parsed = employeeSchema.safeParse({
    name: formData.get('name'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success) {
    redirect('/employees/new');
  }

  await prismaEmployee.employee.create({
    data: {
      name: parsed.data.name,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath('/employees');
  redirect('/employees');
}

export async function updateEmployeeAction(employeeId: string, formData: FormData) {
  const prismaEmployee = prisma as unknown as {
    employee: {
      update(args: unknown): Promise<unknown>;
    };
  };

  const parsed = employeeSchema.safeParse({
    name: formData.get('name'),
    isActive: formData.get('isActive'),
  });

  if (!parsed.success) {
    redirect(`/employees/${employeeId}/edit`);
  }

  await prismaEmployee.employee.update({
    where: { id: employeeId },
    data: {
      name: parsed.data.name,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath('/employees');
  redirect('/employees');
}
