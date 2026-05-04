import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { NavigateButton } from "@/components/shared/navigate-button"
import { ToastQuery } from "@/components/shared/toast-query"
import { Card } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { backendFetch } from "@/lib/backend"
import { OrdersFilter } from "@/components/orders/orders-filter"

type OrdersPageProps = {
  searchParams?: {
    q?: string
    page?: string
    sort?: string
    dir?: string
  }
}

/** Nomor urut kronologis: 1 = nota tertua, total = terbaru (hanya konsisten saat sort = created_at). */
function orderRowNumber(
  index: number,
  rowOffset: number,
  totalOrders: number,
  sort: string,
  dir: string,
): number {
  if (sort === "created_at" && dir === "desc") {
    return totalOrders - rowOffset - index
  }
  return rowOffset + index + 1
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const q = searchParams?.q?.trim()
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
  const sort = (searchParams?.sort ?? "created_at").trim()
  const dir = (searchParams?.dir ?? "desc").trim()
  const pageSize = 20

  const result = await backendFetch<{
    items: Array<{
      id: string
      invoiceNumber: string
      publicToken: string
      customer: { id: string; name: string }
      firstItem?: { serviceType: { id: string; name: string } } | null
      itemCount: number
      total: string
      paymentStatus: string
      workflowStatus: string
    }>
    total: number
  }>(
    `/api/v1/orders?q=${encodeURIComponent(q ?? "")}&page=${page}&pageSize=${pageSize}&sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(dir)}`,
  ).catch(() => ({
    items: [],
    total: 0,
  }))

  const orders = result.items
  const totalOrders = result.total
  const rowOffset = (page - 1) * pageSize

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (sort) params.set("sort", sort)
    if (dir) params.set("dir", dir)
    params.set("page", String(nextPage))
    const query = params.toString()
    return query ? `/orders?${query}` : "/orders"
  }

  return (
    <div>
      <ToastQuery successParam="created" successMessage="Nota berhasil dibuat" />
      <PageHeader title="Nota" actionHref="/orders/new" actionLabel="Tambah Nota" />

      {/* Filter interaktif — client component dengan debounce */}
      <OrdersFilter defaultQ={q} defaultSort={sort} defaultDir={dir} />

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[1%] whitespace-nowrap text-center">No</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order, index) => (
                <TableRow key={order.id}>
                  <TableCell className="whitespace-nowrap text-center text-muted-foreground tabular-nums">
                    {orderRowNumber(index, rowOffset, totalOrders, sort, dir)}
                  </TableCell>
                  <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">
                        {order.firstItem?.serviceType.name ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.itemCount} item</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge type="payment" value={order.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge type="workflow" value={order.workflowStatus} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-2">
                      <NavigateButton href={`/orders/${order.id}`} label="Detail" />
                      {order.publicToken ? (
                        <NavigateButton href={`/receipt/${order.publicToken}`} label="Struk" variant="secondary" />
                      ) : null}
                    </div>
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