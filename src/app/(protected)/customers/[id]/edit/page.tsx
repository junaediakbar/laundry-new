import Link from "next/link"
import { notFound } from "next/navigation"

import { updateCustomerAction } from "@/actions/customer-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { prisma } from "@/lib/prisma"

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
  })

  if (!customer) {
    notFound()
  }

  const updateAction = updateCustomerAction.bind(null, customer.id)

  return (
    <div>
      <PageHeader title={`Edit ${customer.name}`} />
      <Card className="max-w-xl">
        <form action={updateAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required defaultValue={customer.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input id="phone" name="phone" defaultValue={customer.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={customer.email ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" name="address" defaultValue={customer.address ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={customer.notes ?? ""} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Simpan Perubahan</Button>
            <Link href={`/customers/${customer.id}`}>
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
