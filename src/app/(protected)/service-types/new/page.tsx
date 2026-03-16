import Link from "next/link"

import { createServiceTypeAction } from "@/actions/service-type-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

const unitOptions = ["m2", "m1", "kg", "item"]

export default function NewServiceTypePage() {
  return (
    <div>
      <PageHeader title="Tambah Jenis Pesanan" />
      <Card className="max-w-xl">
        <form action={createServiceTypeAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Satuan</Label>
            <Select id="unit" name="unit" required defaultValue="m2">
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultPrice">Harga</Label>
            <Input id="defaultPrice" name="defaultPrice" type="number" min="0" required />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked />
            <Label htmlFor="isActive">Aktif</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Simpan</Button>
            <Link href="/service-types">
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
