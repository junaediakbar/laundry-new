import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSession } from "@/lib/auth"
import { formatCurrency } from "@/lib/format"
import { inOwnerGroupForViewer, performanceRowIsOwnerLike } from "@/lib/owner-group"
import { backendFetch } from "@/lib/backend"

type EmployeePerformancePageProps = {
  searchParams?: {
    startDate?: string
    endDate?: string
  }
}

type Row = {
  employeeId: string
  employeeName: string
  pickupAmount: string
  workAmount: string
  totalAmount: string
}

type EmployeeLite = { id: string; name: string; role?: string }

function mergeOwnerPerformanceRows(
  rows: Array<{
    employeeId: string
    employeeName: string
    pickupAmount: number
    workAmount: number
    totalAmount: number
  }>,
  employees: EmployeeLite[],
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

export default async function EmployeePerformancePage({ searchParams }: EmployeePerformancePageProps) {
  const startDate = searchParams?.startDate
  const endDate = searchParams?.endDate

  const qs = new URLSearchParams()
  if (startDate) qs.set("startDate", startDate)
  if (endDate) qs.set("endDate", endDate)
  const query = qs.toString()

  const session = await getSession()
  const viewerRole = session?.role

  const [rowsRaw, employeesRaw] = await Promise.all([
    backendFetch<Row[]>(`/api/v1/employees/performance${query ? `?${query}` : ""}`).catch(() => []),
    backendFetch<EmployeeLite[]>(`/api/v1/employees`).catch(() => []),
  ])

  const rows = Array.isArray(rowsRaw) ? rowsRaw : []
  const employees = Array.isArray(employeesRaw) ? employeesRaw : []

  const numeric = rows.map((r) => ({
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    pickupAmount: Number(r.pickupAmount),
    workAmount: Number(r.workAmount),
    totalAmount: Number(r.totalAmount),
  }))

  const sorted = mergeOwnerPerformanceRows(numeric, employees, viewerRole)

  const totalPickup = sorted.reduce((sum, r) => sum + r.pickupAmount, 0)
  const totalWork = sorted.reduce((sum, r) => sum + r.workAmount, 0)
  const totalAll = sorted.reduce((sum, r) => sum + r.totalAmount, 0)

  return (
    <div>
      <PageHeader title="Performa Karyawan" description="Rekap upah berdasarkan tugas antar-jemput dan pengerjaan. Akun Owner digabung dalam satu baris." />
      <Card className="mb-4">
        <form>
          <div className="grid gap-3 md:grid-cols-4">
            <Input type="date" name="startDate" defaultValue={startDate} />
            <Input type="date" name="endDate" defaultValue={endDate} />
            <Button type="submit">Terapkan</Button>
          </div>
        </form>
      </Card>

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
              {sorted.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell className="font-medium">{row.employeeName}</TableCell>
                  <TableCell>{formatCurrency(row.pickupAmount)}</TableCell>
                  <TableCell>{formatCurrency(row.workAmount)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(row.totalAmount)}</TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 ? (
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
    </div>
  )
}
