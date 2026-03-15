'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { customerSchema } from '@/lib/validations';

export async function createCustomerAction(formData: FormData) {
  const parsed = customerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) {
    redirect('/customers/new');
  }

  const customer = await prisma.customer.create({
    data: {
      ...parsed.data,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath('/customers');
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomerAction(
  customerId: string,
  formData: FormData,
) {
  const parsed = customerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) {
    redirect(`/customers/${customerId}/edit`);
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...parsed.data,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath('/customers');
  redirect(`/customers/${customerId}`);
}
