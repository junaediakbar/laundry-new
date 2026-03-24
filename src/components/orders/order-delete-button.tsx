'use client';

import { useTransition } from 'react';

import { deleteOrderAction } from '@/actions/order-actions';
import { Button } from '@/components/ui/button';

export function OrderDeleteButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm('Hapus nota ini beserta item dan pembayaran terkait? Tindakan tidak dapat dibatalkan.')) {
          return;
        }
        startTransition(() => {
          void deleteOrderAction(orderId);
        });
      }}>
      {pending ? 'Menghapus…' : 'Hapus nota'}
    </Button>
  );
}
