'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { customerSchema } from '@/lib/validations';

export async function createCustomerAction(formData: FormData) {
  const prismaCustomer = prisma as unknown as {
    customer: {
      create(args: unknown): Promise<{ id: string }>;
      update(args: unknown): Promise<unknown>;
    };
  };

  const parsed = customerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) {
    redirect('/customers/new');
  }

  const customer = await prismaCustomer.customer.create({
    data: {
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      notes: parsed.data.notes || null,
      name: parsed.data.name,
    },
  });

  revalidatePath('/customers');
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomerAction(
  customerId: string,
  formData: FormData,
) {
  const prismaCustomer = prisma as unknown as {
    customer: {
      update(args: unknown): Promise<unknown>;
    };
  };

  const parsed = customerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) {
    redirect(`/customers/${customerId}/edit`);
  }

  await prismaCustomer.customer.update({
    where: { id: customerId },
    data: {
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      notes: parsed.data.notes || null,
      name: parsed.data.name,
    },
  });

  revalidatePath('/customers');
  redirect(`/customers/${customerId}`);
}
