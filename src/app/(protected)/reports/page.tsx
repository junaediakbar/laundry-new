import { ExportCsvButton } from "@/components/reports/export-csv-button"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/format"
import { prisma } from "@/lib/prisma"

type ReportsPageProps = {
  searchParams?: {
    startDate?: string
    endDate?: string
    page?: string
  }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const startDate = searchParams?.startDate
  const endDate = searchParams?.endDate
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
  const pageSize = 20

  const start = startDate ? new Date(startDate) : undefined
  const end = endDate ? new Date(`${endDate}T23:59:59`) : undefined

  const where =
    start || end
      ? {
        createdAt: {
          gte: start,
          lte: end,
        },
      }
      : undefined

  const [orders, totalOrders, revenueResult] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { total: true } }),
  ])

  const totalRevenue = Number(revenueResult._sum.total ?? 0)

  const exportHref = `/reports/export?startDate=${startDate ?? ""}&endDate=${endDate ?? ""}`
  const exportFilename = `report-${startDate ?? "all"}-${endDate ?? "all"}.csv`
  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    params.set("page", String(nextPage))
    const query = params.toString()
    return query ? `/reports?${query}` : "/reports"
  }

  return (
    <div>
      <PageHeader title="Laporan" description="Filter laporan berdasarkan tanggal." />
      <Card className="mb-4">
        <form>
          <div className="grid gap-3 md:grid-cols-4">
            <Input type="date" name="startDate" defaultValue={startDate} />
            <Input type="date" name="endDate" defaultValue={endDate} />
            <Button type="submit">Terapkan</Button>
            <ExportCsvButton href={exportHref} filename={exportFilename} />
          </div>
        </form>
      </Card>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm text-muted-foreground">Total Nota</p>
          <p className="mt-2 text-3xl font-semibold">{totalOrders}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalRevenue)}</p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(
                (order: {
                  id: string
                  createdAt: Date
                  invoiceNumber: string
                  customer: { name: string }
                  total: { toString(): string }
                }) => (
                  <TableRow key={order.id}>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>{formatCurrency(Number(order.total.toString()))}</TableCell>
                  </TableRow>
                ),
              )}
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Tidak ada data pada rentang tanggal ini.
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
