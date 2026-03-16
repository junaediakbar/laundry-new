import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"
import { prisma } from "@/lib/prisma"

type EmployeePerformancePageProps = {
  searchParams?: {
    startDate?: string
    endDate?: string
  }
}

const pickupTaskTypes = new Set(["pickup", "dropoff", "fuel_vehicle", "driver"])
const workTaskTypes = new Set([
  "dust_removal",
  "brushing",
  "rinse_sprayer",
  "spin_dry",
  "finishing_packing",
])

export default async function EmployeePerformancePage({ searchParams }: EmployeePerformancePageProps) {
  const startDate = searchParams?.startDate
  const endDate = searchParams?.endDate

  const start = startDate ? new Date(startDate) : undefined
  const end = endDate ? new Date(`${endDate}T23:59:59`) : undefined

  const prismaWork = prisma as unknown as {
    workAssignment: {
      findMany(args: unknown): Promise<
        Array<{
          taskType: string
          amount: { toString(): string }
          employee: { id: string; name: string }
        }>
      >
    }
  }

  const assignments = await prismaWork.workAssignment.findMany({
    where:
      start || end
        ? {
            order: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          }
        : undefined,
    include: { employee: true, order: { select: { createdAt: true } } },
    orderBy: { createdAt: "desc" },
  })

  const rows = new Map<
    string,
    { employeeName: string; pickupAmount: number; workAmount: number; totalAmount: number }
  >()

  for (const item of assignments) {
    const amount = Number(item.amount.toString())
    const current =
      rows.get(item.employee.id) ??
      { employeeName: item.employee.name, pickupAmount: 0, workAmount: 0, totalAmount: 0 }

    if (pickupTaskTypes.has(item.taskType)) {
      current.pickupAmount += amount
    }
    if (workTaskTypes.has(item.taskType)) {
      current.workAmount += amount
    }
    current.totalAmount += amount
    rows.set(item.employee.id, current)
  }

  const sorted = Array.from(rows.entries())
    .map(([employeeId, value]) => ({ employeeId, ...value }))
    .sort((a, b) => b.totalAmount - a.totalAmount)

  const totalPickup = sorted.reduce((sum, r) => sum + r.pickupAmount, 0)
  const totalWork = sorted.reduce((sum, r) => sum + r.workAmount, 0)
  const totalAll = sorted.reduce((sum, r) => sum + r.totalAmount, 0)

  return (
    <div>
      <PageHeader title="Performa Karyawan" description="Rekap upah berdasarkan tugas antar-jemput dan pengerjaan." />
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
