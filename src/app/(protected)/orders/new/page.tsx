import Link from "next/link"

import { createOrderAction } from "@/actions/order-actions"
import { OrderItemsForm } from "@/components/orders/order-items-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { prisma } from "@/lib/prisma"

export default async function NewOrderPage() {
  const [customers, serviceTypes] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.serviceType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  const serviceTypeOptions = serviceTypes.map((serviceType) => ({
    id: serviceType.id,
    name: serviceType.name,
    unit: serviceType.unit,
    defaultPrice: Number(serviceType.defaultPrice),
  }))

  return (
    <div>
      <PageHeader title="Tambah Nota" description="Satu nota bisa memiliki beberapa item pesanan." />
      <Card className="max-w-2xl">
        <form action={createOrderAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId">Pelanggan</Label>
            <Select id="customerId" name="customerId" required defaultValue="">
              <option value="">Pilih pelanggan</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </div>

          <OrderItemsForm serviceTypes={serviceTypeOptions} />

          <div className="space-y-2">
            <Label htmlFor="note">Catatan</Label>
            <Textarea id="note" name="note" rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Simpan</Button>
            <Link href="/orders">
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
