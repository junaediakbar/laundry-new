import Link from "next/link"

import { createTeamMemberAction } from "@/actions/employee-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

export default function NewTeamMemberPage() {
  return (
    <div>
      <PageHeader
        title="Tambah anggota tim"
        description="Profil dan akun login dibuat sekaligus untuk orang yang sama."
      />
      <Card className="max-w-xl p-6">
        <h2 className="text-base font-semibold tracking-tight">Data anggota</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Email dan password dipakai untuk masuk ke aplikasi. Role menentukan izin akses.
        </p>

        <form action={createTeamMemberAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" required defaultValue="employee">
              <option value="employee">Karyawan</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="cashier">Kasir</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked />
            <Label htmlFor="isActive">Aktif</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit">Simpan</Button>
            <Link href="/employees">
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
