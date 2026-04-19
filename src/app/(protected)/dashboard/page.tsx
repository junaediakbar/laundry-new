import { AlertCircle, ReceiptText, TrendingUp, Users } from "lucide-react"

import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { backendFetch } from "@/lib/backend"
import { requireAuth } from "@/lib/auth"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

type DashboardPageProps = {
  searchParams?: {
    month?: string
  }
}

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

type PerfRow = {
  employeeId: string
  employeeName: string
  pickupAmount: string
  workAmount: string
  totalAmount: string
}

async function EmployeeDashboard({ searchParams }: DashboardPageProps) {
  const thisRange = currentMonthYmdRange(DASHBOARD_TZ)
  const selectedMonth = (searchParams?.month ?? "").trim()
  const chosen = monthYmdRange(selectedMonth) ?? thisRange

  const rowsRaw = await backendFetch<PerfRow[]>(
    `/api/v1/employees/performance?startDate=${encodeURIComponent(chosen.start)}&endDate=${encodeURIComponent(chosen.end)}`,
  ).catch(() => [])
  const rows = Array.isArray(rowsRaw) ? rowsRaw : []
  const row = rows[0]

  const pickup = Number(row?.pickupAmount ?? 0)
  const work = Number(row?.workAmount ?? 0)
  const total = Number(row?.totalAmount ?? 0)

  const cards = [
    {
      title: "Pickup / antar",
      value: formatCurrency(pickup),
      icon: ReceiptText,
      accent: "from-sky-500/15 to-blue-500/10",
      iconBg: "bg-sky-500/15 text-sky-800",
    },
    {
      title: "Kerja proses",
      value: formatCurrency(work),
      icon: TrendingUp,
      accent: "from-violet-500/15 to-purple-500/10",
      iconBg: "bg-violet-500/15 text-violet-800",
    },
    {
      title: "Total bagian Anda",
      value: formatCurrency(total),
      icon: Users,
      accent: "from-emerald-500/15 to-teal-500/10",
      iconBg: "bg-emerald-500/15 text-emerald-800",
    },
  ] as const

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          row
            ? `Kinerja Anda (${row.employeeName}) — dari pembagian tugas pada nota.`
            : "Kinerja Anda — dari pembagian tugas pada nota."
        }
      />

      <Card className="mb-4">
        <form method="get" action="/dashboard" className="flex gap-3">
          <div className="w-full">
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              type="month"
              name="month"
              defaultValue={chosen.month}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Terapkan</Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Rentang: {chosen.start} s/d {chosen.end} (WITA). Nilai mengikuti tanggal nota masuk.
        </p>
      </Card>

      {!row ? (
        <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
          Belum ada pembagian tugas untuk Anda pada periode ini, atau akun belum tertaut ke data karyawan.
        </Card>
      ) : (
        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2",
            "xl:grid-cols-3",
            "landscape:gap-3 landscape:sm:grid-cols-2 landscape:lg:grid-cols-3",
          )}
        >
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <Card
                key={card.title}
                className={cn(
                  "group relative animate-fade-in-up overflow-hidden border-border/60 bg-gradient-to-br p-5 transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10",
                  card.accent,
                )}
                style={{ animationDelay: `${i * 70}ms`, animationFillMode: "backwards" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">
                      {card.value}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
                      card.iconBg,
                    )}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                  </span>
                </div>
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

async function StaffDashboard({ searchParams }: DashboardPageProps) {
  const thisRange = currentMonthYmdRange(DASHBOARD_TZ)
  const selectedMonth = (searchParams?.month ?? "").trim()
  const chosen = monthYmdRange(selectedMonth) ?? thisRange

  const summary = await backendFetch<{
    customerCount: number
    orderCount: number
    unpaidCount: number
    totalRevenue: string
  }>(`/api/v1/dashboard/summary?startDate=${encodeURIComponent(chosen.start)}&endDate=${encodeURIComponent(chosen.end)}`).catch(() => ({
    customerCount: 0,
    orderCount: 0,
    unpaidCount: 0,
    totalRevenue: "0",
  }))

  const series = await backendFetch<
    Array<{ date: string; orderCount: number; notaTotal: string; revenue: string }>
  >(`/api/v1/dashboard/revenue-series?startDate=${encodeURIComponent(chosen.start)}&endDate=${encodeURIComponent(chosen.end)}`).catch(
    () => [],
  )
  const chartData = (Array.isArray(series) ? series : []).map((p) => ({
    date: p.date,
    orderCount: Number(p.orderCount ?? 0),
    notaTotal: Number(p.notaTotal ?? 0),
    revenue: Number(p.revenue ?? 0),
  }))

  const totalRevenue = Number(summary.totalRevenue ?? 0)

  const cards = [
    {
      title: "Pelanggan Baru",
      value: `${summary.customerCount}`,
      icon: Users,
      accent: "from-teal-500/15 to-cyan-500/10",
      iconBg: "bg-teal-500/15 text-teal-700",
    },
    {
      title: "Total Nota",
      value: `${summary.orderCount}`,
      icon: ReceiptText,
      accent: "from-sky-500/15 to-blue-500/10",
      iconBg: "bg-sky-500/15 text-sky-800",
    },
    {
      title: "Nota Belum Lunas",
      value: `${summary.unpaidCount}`,
      icon: AlertCircle,
      accent: "from-amber-500/15 to-orange-500/10",
      iconBg: "bg-amber-500/15 text-amber-800",
    },
    {
      title: "Pendapatan",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      accent: "from-emerald-500/15 to-teal-500/10",
      iconBg: "bg-emerald-500/15 text-emerald-800",
    },
  ] as const

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional laundry — pantau pelanggan, nota, dan pembayaran dalam satu layar."
      />

      <Card className="mb-4">
        <form method="get" action="/dashboard" className="flex gap-3">
          <div className="w-full">
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              type="month"
              name="month"
              defaultValue={chosen.month}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Terapkan</Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Rentang: {chosen.start} s/d {chosen.end} (WITA)
        </p>
      </Card>

      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          "xl:grid-cols-4",
          "landscape:gap-3 landscape:sm:grid-cols-2 landscape:lg:grid-cols-4",
        )}
      >
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              className={cn(
                "group relative animate-fade-in-up overflow-hidden border-border/60 bg-gradient-to-br p-5 transition-all duration-300",
                "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10",
                card.accent,
              )}
              style={{ animationDelay: `${i * 70}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">
                    {card.value}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
                    card.iconBg,
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                </span>
              </div>
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </Card>
          )
        })}
      </div>

      <Card className="mt-4">
        <p className="text-sm font-medium">Grafik pendapatan & nota</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pendapatan mengikuti tanggal bayar. Jumlah & nilai nota mengikuti tanggal nota masuk; nilai nota memakai total di nota sehingga tetap terhitung meski belum lunas.
        </p>
        <div className="mt-4">
          {chartData.length > 0 ? (
            <RevenueChart data={chartData} />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Belum ada data pada bulan ini.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default async function DashboardPage(props: DashboardPageProps) {
  const session = await requireAuth()
  if (session.role === "employee") {
    return <EmployeeDashboard searchParams={props.searchParams} />
  }
  return <StaffDashboard searchParams={props.searchParams} />
}
