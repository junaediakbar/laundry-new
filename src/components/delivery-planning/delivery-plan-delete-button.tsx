'use client';
import { useTransition } from 'react';
import { deleteDeliveryPlanAction } from '@/actions/delivery-planning-actions';
import { Button } from '@/components/ui/button';
export function DeliveryPlanDeleteButton({ planId }: { planId: string }) {
  const [pending, startTransition] = useTransition();
  return <Button type='button' variant='destructive' disabled={pending} onClick={() => { if (!confirm('Hapus rencana pengiriman ini?')) return; startTransition(() => { void deleteDeliveryPlanAction(planId); }); }}>{pending ? 'Menghapus…' : 'Hapus rencana'}</Button>;
}
