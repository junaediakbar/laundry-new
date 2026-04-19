import Link from "next/link"
import { notFound } from "next/navigation"

import { deleteEmployeeAction, updateTeamMemberAction } from "@/actions/employee-actions"
import { EmployeeDeleteButton } from "@/components/employees/employee-delete-button"
import { PageHeader } from "@/components/shared/page-header"
import { ToastQuery } from "@/components/shared/toast-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { backendFetch } from "@/lib/backend"

type EmployeeRow = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const employee = await backendFetch<EmployeeRow>(`/api/v1/employees/${params.id}`).catch(() => null)

  if (!employee) {
    notFound()
  }

  const save = updateTeamMemberAction.bind(null, employee.id)

  return (
    <div className="space-y-6">
      <ToastQuery successParam="saved" successMessage="Data berhasil disimpan" />
      <PageHeader
        title={`Kelola: ${employee.name}`}
        description="Ubah nama, email, role, password, dan status aktif — satu formulir untuk profil dan akun."
      />

      <Card className="max-w-xl p-6">
        <h2 className="text-base font-semibold tracking-tight">Profil &amp; akun</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Kosongkan password jika tidak ingin mengganti kata sandi.
        </p>

        <form action={save} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required defaultValue={employee.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required defaultValue={employee.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password baru (opsional)</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" required defaultValue={employee.role}>
              <option value="employee">Karyawan</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="cashier">Kasir</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked={employee.isActive} />
            <Label htmlFor="isActive">Aktif</Label>
          </div>
          <Button type="submit">Simpan</Button>
        </form>

        <div className="mt-8 border-t border-border/60 pt-6">
          <p className="mb-2 text-xs text-muted-foreground">
            Menghapus anggota menghapus profil dan akses login sekaligus.
          </p>
          <EmployeeDeleteButton employeeId={employee.id} />
        </div>
      </Card>

      <div>
        <Link href="/employees">
          <Button variant="outline">Kembali ke daftar</Button>
        </Link>
      </div>
    </div>
  )
}
