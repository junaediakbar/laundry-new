import { ArrowLeft, Calendar, ReceiptText } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { OrderImageCell } from "@/components/employees/order-image-cell"
import { backendFetch } from "@/lib/backend"
import { formatCurrency } from "@/lib/format"
import { labelEmployeePerformanceTask } from "@/lib/employee-task-labels"
import { getSession } from "@/lib/auth"
import { inOwnerGroupForViewer, performanceRowIsOwnerLike } from "@/lib/owner-group"
import Link from "next/link"
import { redirect } from "next/navigation"

type EmployeePerformancePageProps = {
  searchParams?: {
    month?: string
    employeeId?: string
    startDate?: string
    endDate?: string
    dateBasis?: string
  }
}

type AggregateRow = {
  employeeId: string
  employeeName: string
  pickupAmount: number
  workAmount: number
  totalAmount: number
}

type DetailRow = {
  orderId: string
  invoiceNumber: string
  customerName: string
  createdAt: string
  workflowStatus: string
  pickupAmount: string
  workAmount: string
  totalAmount: string
  orderTotal?: string
  tasks?: { taskType: string; percent?: string; amount: string }[]
}

type Employee = { id: string; name: string; role?: string; isActive?: boolean }

const DASHBOARD_TZ = "Asia/Makassar"

function ymdForTz(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

function currentMonthYmdRange(timeZone: string) {
  const todayYmd = ymdForTz(new Date(), timeZone)
  const y = Number(todayYmd.slice(0, 4))
  const m = Number(todayYmd.slice(5, 7))
  const start = `${todayYmd.slice(0, 8)}01`
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const end = `${todayYmd.slice(0, 8)}${String(lastDay).padStart(2, "0")}`
  return { start, end, month: `${todayYmd.slice(0, 7)}` }
}

function monthYmdRange(month: string) {
  const m = month.trim()
  const ok = /^\d{4}-\d{2}$/.test(m)
  if (!ok) return null
  const y = Number(m.slice(0, 4))
  const mo = Number(m.slice(5, 7))
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  return { start: `${m}-01`, end: `${m}-${String(lastDay).padStart(2, "0")}`, month: m }
}

function mergeOwnerPerformanceRows(
  rows: AggregateRow[],
  employees: Employee[],
  viewerRole: string | undefined,
) {
  const ownerIds = new Set(
    employees.filter((e) => inOwnerGroupForViewer(e, viewerRole)).map((e) => e.id),
  )

  let pickupO = 0
  let workO = 0
  let totalO = 0
  let mergedAny = false
  const rest: typeof rows = []

  for (const r of rows) {
    if (performanceRowIsOwnerLike(r, ownerIds)) {
      mergedAny = true
      pickupO += r.pickupAmount
      workO += r.workAmount
      totalO += r.totalAmount
    } else {
      rest.push(r)
    }
  }

  const out = [...rest]
  if (mergedAny) {
    out.push({
      employeeId: "__owner_merged__",
      employeeName: "Owner",
      pickupAmount: pickupO,
      workAmount: workO,
      totalAmount: totalO,
    })
  }

  return out.sort((a, b) => b.totalAmount - a.totalAmount)
}

function getStatusBadge(status: string) {
  const variantMap: Record<string, "default" | "secondary" | "outline"> = {
    pending: "secondary",
    processing: "default",
    completed: "outline",
    delivered: "outline",
  }
  const labelMap: Record<string, string> = {
    pending: "Menunggu",
    processing: "Diproses",
    completed: "Selesai",
    delivered: "Diantar",
  }
  return (
    <Badge variant={variantMap[status] ?? "secondary"}>
      {labelMap[status] ?? status}
    </Badge>
  )
}

export default async function EmployeePerformancePage({ searchParams }: EmployeePerformancePageProps) {
  const session = await getSession()
  const viewerRole = session?.role
  // Performa karyawan hanya untuk Owner & Admin.
  if (viewerRole !== "owner" && viewerRole !== "admin") {
    redirect("/dashboard")
  }

  // Parse month or date range
  const thisMonth = currentMonthYmdRange(DASHBOARD_TZ)
  const selectedMonth = (searchParams?.month ?? "").trim()
  const chosenMonth = monthYmdRange(selectedMonth) ?? thisMonth

  let startDate, endDate, displayMonth
  if (searchParams?.startDate && searchParams?.endDate) {
    startDate = searchParams.startDate
    endDate = searchParams.endDate
    displayMonth = chosenMonth.month
  } else {
    startDate = chosenMonth.start
    endDate = chosenMonth.end
    displayMonth = chosenMonth.month
  }

  const selectedEmployeeId = searchParams?.employeeId
  const dateBasis = searchParams?.dateBasis === "work" ? "work" : "order"

  // Fetch employees and performance data
  const [employeesRaw, aggregateData, employeeInfo, detailData] = await Promise.all([
    backendFetch<Employee[]>("/api/v1/employees").catch(() => []),
    backendFetch<
      Array<{
        employeeId: string
        employeeName: string
        pickupAmount: string
        workAmount: string
        totalAmount: string
      }>
    >(`/api/v1/employees/performance?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&dateBasis=${dateBasis}`).catch(
      () => [],
    ),
    selectedEmployeeId
      ? backendFetch<Employee>(`/api/v1/employees/${selectedEmployeeId}`).catch(() => null)
      : null,
    selectedEmployeeId
      ? backendFetch<DetailRow[]>(
          `/api/v1/employees/${selectedEmployeeId}/performance-detail?month=${encodeURIComponent(displayMonth)}&dateBasis=${dateBasis}`,
        ).catch(() => [])
      : null,
  ])

  const employees = Array.isArray(employeesRaw) ? employeesRaw : []
  const activeEmployees = employees.filter((emp) => emp.isActive !== false)
  const aggregateRows = Array.isArray(aggregateData) ? aggregateData : []

  const numericAggregate = aggregateRows.map((r) => ({
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    pickupAmount: Number(r.pickupAmount),
    workAmount: Number(r.workAmount),
    totalAmount: Number(r.totalAmount),
  }))

  const sortedAggregate = mergeOwnerPerformanceRows(numericAggregate, employees, viewerRole)

  // Calculate totals for aggregate view
  const totalPickup = sortedAggregate.reduce((sum, r) => sum + r.pickupAmount, 0)
  const totalWork = sortedAggregate.reduce((sum, r) => sum + r.workAmount, 0)
  const totalAll = sortedAggregate.reduce((sum, r) => sum + r.totalAmount, 0)

  // Detail view calculations
  const detailRows = Array.isArray(detailData) ? detailData : []
  const detailTotalPickup = detailRows.reduce((sum, r) => sum + Number(r.pickupAmount ?? 0), 0)
  const detailTotalWork = detailRows.reduce((sum, r) => sum + Number(r.workAmount ?? 0), 0)
  const detailTotalAll = detailRows.reduce((sum, r) => sum + Number(r.totalAmount ?? 0), 0)

  const isDetailView = selectedEmployeeId && employeeInfo

  return (
    <div>
      <div className="mb-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>

      <PageHeader
        title={isDetailView ? `Detail Performa: ${employeeInfo.name}` : "Performa Karyawan"}
        description={
          isDetailView
            ? "Daftar pekerjaan berdasarkan nota order"
            : "Rekap upah berdasarkan tugas antar-jemput dan pengerjaan. Akun Owner digabung dalam satu baris."
        }
      />

      <Card className="mb-4">
        <form method="get" action="/employees/performance" className="flex gap-3">
          <div className="grid w-full gap-3 md:grid-cols-4">
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              type="month"
              name="month"
              defaultValue={displayMonth}
            />
            <select
              name="dateBasis"
              defaultValue={dateBasis}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="order">Tanggal Nota</option>
              <option value="work">Tanggal Pengerjaan</option>
            </select>
            <select
              name="employeeId"
              defaultValue={selectedEmployeeId ?? ""}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Semua Karyawan</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
            <Button type="submit">Terapkan</Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Rentang: {startDate} s/d {endDate} (WITA) ·{" "}
          {dateBasis === "work" ? "berdasarkan tanggal pengerjaan" : "berdasarkan tanggal nota"}
        </p>
      </Card>

      {isDetailView ? (
        <>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-sm text-muted-foreground">Total Antar Jemput</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(detailTotalPickup)}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Total Pengerjaan</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(detailTotalWork)}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Total Upah</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(detailTotalAll)}</p>
            </Card>
          </div>

          <Card className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Nota</TableHead>
                    <TableHead>Gambar</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detail tugas</TableHead>
                    <TableHead className="text-right">Harga Total</TableHead>
                    <TableHead className="text-right">Antar Jemput</TableHead>
                    <TableHead className="text-right">Pengerjaan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailRows.map((row) => (
                    <TableRow key={row.orderId}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/orders/${row.orderId}`}
                          className="flex items-center gap-2 hover:text-primary"
                        >
                          <ReceiptText className="h-4 w-4 text-muted-foreground" />
                          {row.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <OrderImageCell orderId={row.orderId} invoiceNumber={row.invoiceNumber} />
                      </TableCell>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(row.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(row.workflowStatus)}</TableCell>
                      <TableCell className="max-w-[220px] align-top text-sm text-muted-foreground">
                        {(row.tasks?.length ?? 0) > 0 ? (
                          <ul className="list-inside list-disc space-y-0.5">
                            {(row.tasks ?? []).map((t) => (
                              <li key={t.taskType}>
                                <span className="text-foreground">
                                  {labelEmployeePerformanceTask(t.taskType)}
                                </span>
                                {t.percent ? (
                                  <span className="text-muted-foreground"> · {Number(t.percent)}%</span>
                                ) : null}
                                <span className="tabular-nums"> · {formatCurrency(Number(t.amount))}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(Number(row.orderTotal ?? 0))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(row.pickupAmount))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(row.workAmount))}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(row.totalAmount))}</TableCell>
                    </TableRow>
                  ))}
                  {detailRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                        Belum ada data performa pada rentang tanggal ini.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-sm text-muted-foreground">Total Antar Jemput</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalPickup)}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Total Pengerjaan</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalWork)}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted-foreground">Total Upah</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalAll)}</p>
            </Card>
          </div>

          <Card className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Antar Jemput</TableHead>
                    <TableHead>Pengerjaan</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAggregate.map((row) => (
                    <TableRow key={row.employeeId}>
                      <TableCell className="font-medium">{row.employeeName}</TableCell>
                      <TableCell>{formatCurrency(row.pickupAmount)}</TableCell>
                      <TableCell>{formatCurrency(row.workAmount)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(row.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                  {sortedAggregate.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                        Belum ada data performa pada rentang tanggal ini.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
