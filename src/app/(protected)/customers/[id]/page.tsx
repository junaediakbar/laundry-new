import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { prisma } from "@/lib/prisma"

type CustomerDetailRow = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  latitude: { toString(): string } | number | null
  longitude: { toString(): string } | number | null
  orders: Array<{ id: string; invoiceNumber: string; total: { toString(): string } | number; workflowStatus: string }>
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = (await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })) as unknown as CustomerDetailRow | null

  if (!customer) {
    notFound()
  }

  const lat = customer.latitude != null ? Number(customer.latitude) : null
  const lng = customer.longitude != null ? Number(customer.longitude) : null
  const mapsHref = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null

  return (
    <div>
      <PageHeader title={customer.name} description="Detail pelanggan dan histori pesanan." />
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Telepon</p>
              <p className="font-medium">{customer.phone ?? "-"}</p>
            </div>
            <Link href={`/customers/${customer.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{customer.email ?? "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Alamat</p>
              <p className="text-sm font-medium">{customer.address ?? "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Koordinat</p>
              <p className="text-sm font-medium">{lat != null && lng != null ? `${lat}, ${lng}` : "-"}</p>
              {mapsHref ? (
                <a href={mapsHref} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline underline-offset-4">
                  Buka di Google Maps
                </a>
              ) : null}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Catatan</p>
              <p className="text-sm font-medium">{customer.notes ?? "-"}</p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Total Nota (terakhir 10)</p>
          <p className="mt-2 text-3xl font-semibold">{customer.orders.length}</p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link href={`/orders/${order.id}`} prefetch={false}>
                      <Button variant="secondary" size="sm">
                        {order.invoiceNumber}
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>{Number(order.total).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="capitalize">{order.workflowStatus.replace("_", " ")}</TableCell>
                </TableRow>
              ))}
              {customer.orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    Belum ada histori pesanan.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
