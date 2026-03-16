import Link from "next/link"
import { notFound } from "next/navigation"

import { updateServiceTypeAction } from "@/actions/service-type-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { prisma } from "@/lib/prisma"

const unitOptions = ["m2", "m1", "kg", "item"]

export default async function EditServiceTypePage({ params }: { params: { id: string } }) {
  const serviceType = await prisma.serviceType.findUnique({
    where: { id: params.id },
  })

  if (!serviceType) {
    notFound()
  }

  const updateAction = updateServiceTypeAction.bind(null, serviceType.id)

  return (
    <div>
      <PageHeader title={`Edit ${serviceType.name}`} />
      <Card className="max-w-xl">
        <form action={updateAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required defaultValue={serviceType.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Satuan</Label>
            <Select id="unit" name="unit" required defaultValue={serviceType.unit}>
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultPrice">Harga</Label>
            <Input
              id="defaultPrice"
              name="defaultPrice"
              type="number"
              min="0"
              required
              defaultValue={Number(serviceType.defaultPrice)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked={serviceType.isActive} />
            <Label htmlFor="isActive">Aktif</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Simpan Perubahan</Button>
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
