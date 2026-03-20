import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"
import { prisma } from "@/lib/prisma"

type OrdersPageProps = {
  searchParams?: {
    q?: string
    page?: string
  }
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const q = searchParams?.q?.trim()
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
  const pageSize = 20

  const where = q
    ? {
      OR: [
        { invoiceNumber: { contains: q, mode: "insensitive" as const } },
        { customer: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }
    : undefined

  const [orders, totalOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          take: 1,
          include: { serviceType: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ])

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(nextPage))
    const query = params.toString()
    return query ? `/orders?${query}` : "/orders"
  }

  return (
    <div>
      <PageHeader title="Nota" actionHref="/orders/new" actionLabel="Tambah Nota" />
      <form className="mb-4 flex max-w-md gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Cari invoice / nama pelanggan..."
        />
        <Button type="submit" variant="secondary">
          Cari
        </Button>
      </form>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">
                        {order.items[0]?.serviceType.name ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">{order._count.items} item</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(order.total))}</TableCell>
                  <TableCell>
                    <StatusBadge type="payment" value={order.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge type="workflow" value={order.workflowStatus} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/orders/${order.id}`} prefetch={false}>
                      <Button size="sm" variant="outline">
                        Detail
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Belum ada data pesanan.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} pageSize={pageSize} totalItems={totalOrders} buildHref={buildHref} />
      </Card>
    </div>
  )
}
