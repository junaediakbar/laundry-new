'use client';
import { useTransition } from 'react';
import { deleteEmployeeAction } from '@/actions/employee-actions';
import { Button } from '@/components/ui/button';
export function EmployeeDeleteButton({ employeeId }: { employeeId: string }) {
  const [pending, startTransition] = useTransition();
  return <Button type='button' variant='destructive' size='sm' disabled={pending} onClick={() => { if (!confirm('Hapus karyawan ini?')) return; startTransition(() => { void deleteEmployeeAction(employeeId); }); }}>{pending ? 'Menghapus…' : 'Hapus'}</Button>;
}
