'use client';
import { useTransition } from 'react';
import { deleteUserAction } from '@/actions/user-actions';
import { Button } from '@/components/ui/button';
export function UserDeleteButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  return <Button type='button' variant='destructive' size='sm' disabled={pending} onClick={() => { if (!confirm('Hapus user ini?')) return; startTransition(() => { void deleteUserAction(userId); }); }}>{pending ? 'Menghapus…' : 'Hapus'}</Button>;
}
