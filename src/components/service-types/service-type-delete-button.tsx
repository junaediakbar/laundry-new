'use client';
import { useTransition } from 'react';
import { deleteServiceTypeAction } from '@/actions/service-type-actions';
import { Button } from '@/components/ui/button';
export function ServiceTypeDeleteButton({ serviceTypeId }: { serviceTypeId: string }) {
  const [pending, startTransition] = useTransition();
  return <Button type='button' variant='destructive' size='sm' disabled={pending} onClick={() => { if (!confirm('Hapus jenis pesanan ini?')) return; startTransition(() => { void deleteServiceTypeAction(serviceTypeId); }); }}>{pending ? 'Menghapus…' : 'Hapus'}</Button>;
}
