'use client';

import { useTransition } from 'react';

import { deleteCustomerAction } from '@/actions/customer-actions';
import { Button } from '@/components/ui/button';

export function CustomerDeleteButton({ customerId }: { customerId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            'Hapus pelanggan ini? Tidak bisa dihapus jika masih ada nota atau terdaftar di rute pengiriman.',
          )
        ) {
          return;
        }
        startTransition(() => {
          void deleteCustomerAction(customerId);
        });
      }}>
      {pending ? 'Menghapus…' : 'Hapus'}
    </Button>
  );
}
