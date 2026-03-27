import { redirect } from "next/navigation"

import { ExportCsvButton } from "@/components/reports/export-csv-button"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/format"
import { backendFetch } from "@/lib/backend"

/** "Today" in REPORT_TZ (default Asia/Jakarta) as YYYY-MM-DD */
function todayYmdForReports(): string {
  const tz = process.env.REPORT_TZ || "Asia/Jakarta"
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

type ReportsPageProps = {
  searchParams?: {
    startDate?: string
    endDate?: string
    page?: string
  }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const rawStart = searchParams?.startDate
  const rawEnd = searchParams?.endDate

  if (!rawStart?.trim() && !rawEnd?.trim()) {
    const t = todayYmdForReports()
    const p = new URLSearchParams()
    p.set("startDate", t)
    p.set("endDate", t)
    if (searchParams?.page) p.set("page", searchParams.page)
    redirect(`/reports?${p.toString()}`)
  }

  const startDate = rawStart?.trim() ?? ""
  const endDate = rawEnd?.trim() ?? ""
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
  const pageSize = 20

  const qs = new URLSearchParams()
  qs.set("page", String(page))
  qs.set("pageSize", String(pageSize))
  qs.set("q", "")
  if (startDate) qs.set("startDate", startDate)
  if (endDate) qs.set("endDate", endDate)

  const result = await backendFetch<{
    items: Array<{
      id: string
      createdAt: string
      invoiceNumber: string
      customer: { name: string }
      total: string
    }>
    total: number
    revenueTotal?: string
  }>(`/api/v1/orders?${qs.toString()}`).catch(() => ({
    items: [],
    total: 0,
    revenueTotal: "0",
  }))

  const orders = result.items
  const totalOrders = result.total
  const totalRevenue = Number(result.revenueTotal ?? 0)

  const exportHref = `/reports/export?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  const exportFilename = `report-${startDate || "all"}-${endDate || "all"}.csv`
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
      <PageHeader title="Laporan" description="Filter laporan berdasarkan tanggal (default: hari ini)." />
      <Card className="mb-4">
        <form method="get" action="/reports" className="grid gap-3 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Dari tanggal</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={startDate || undefined} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Sampai tanggal</Label>
            <Input id="endDate" name="endDate" type="date" defaultValue={endDate || undefined} />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Terapkan</Button>
          </div>
          <div className="flex items-end">
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
          <p className="text-sm text-muted-foreground">Total omzet (filter)</p>
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
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatDate(new Date(order.createdAt))}</TableCell>
                  <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>{formatCurrency(Number(order.total))}</TableCell>
                </TableRow>
              ))}
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
