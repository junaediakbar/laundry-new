import Link from "next/link"

import { createOrderAction } from "@/actions/order-actions"
import { CustomerSelect } from "@/components/orders/customer-select"
import { OrderItemsForm } from "@/components/orders/order-items-form"
import { PageHeader } from "@/components/shared/page-header"
import { SubmitButton } from "@/components/shared/submit-button"
import { ToastQuery } from "@/components/shared/toast-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { backendFetch } from "@/lib/backend"

export default async function NewOrderPage() {
  const [customerPaged, serviceTypes] = await Promise.all([
    backendFetch<{
      items: Array<{ id: string; name: string; phone: string | null }>
    }>(`/api/v1/customers?page=1&pageSize=200&q=`),
    backendFetch<Array<{ id: string; name: string; unit: string; defaultPrice: string }>>(
      `/api/v1/service-types?active=true`,
    ),
  ]).catch(
    () =>
      [
        { items: [] as Array<{ id: string; name: string; phone: string | null }> },
        [] as Array<{ id: string; name: string; unit: string; defaultPrice: string }>,
      ] as const,
  )

  const customers = customerPaged.items


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
      <ToastQuery errorParam="error" errorMessageFallback="Gagal membuat nota" />
      <PageHeader title="Tambah Nota" description="Satu nota bisa memiliki beberapa item pesanan." />
      <Card className="max-w-2xl">
        <form action={createOrderAction} encType="multipart/form-data" className="space-y-4">
          <CustomerSelect defaultCustomerId={customerOptions[0]?.id} />

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
            <Label htmlFor="image">Gambar Nota (opsional)</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Catatan</Label>
            <Textarea id="note" name="note" rows={3} />
          </div>
          <div className="flex gap-2">
            <SubmitButton label="Simpan" loadingLabel="Menyimpan..." />
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
