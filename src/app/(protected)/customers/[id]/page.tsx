import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { prisma } from "@/lib/prisma"

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })

  if (!customer) {
    notFound()
  }

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
                    <Link href={`/orders/${order.id}`}>
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
