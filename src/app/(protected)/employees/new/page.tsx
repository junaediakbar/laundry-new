import Link from "next/link"

import { createEmployeeAction } from "@/actions/employee-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewEmployeePage() {
  return (
    <div>
      <PageHeader title="Tambah Karyawan" />
      <Card className="max-w-xl">
        <form action={createEmployeeAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked />
            <Label htmlFor="isActive">Aktif</Label>
          </div>
          <div className="flex gap-2">
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
