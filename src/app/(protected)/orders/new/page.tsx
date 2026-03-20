import Link from "next/link"

import { createOrderAction } from "@/actions/order-actions"
import { CustomerSelect } from "@/components/orders/customer-select"
import { OrderItemsForm } from "@/components/orders/order-items-form"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { prisma } from "@/lib/prisma"

export default async function NewOrderPage() {
  const [customers, serviceTypes] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.serviceType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
  }))

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
          <CustomerSelect customers={customerOptions} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receivedDate">Tanggal Masuk</Label>
              <Input id="receivedDate" name="receivedDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completedDate">Tanggal Selesai</Label>
              <Input id="completedDate" name="completedDate" type="date" />
            </div>
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
