"use client"

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

export type DashboardChartPoint = {
  date: string
  orderCount: number
  /** Total nominal nota per hari (SUM order.total); termasuk belum/parsial/lunas */
  notaTotal: number
  revenue: number
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

/** Backend mengirim YYYY-MM-DD = hari kalender bisnis WITA; label harus sama di zona Asia/Makassar, bukan zona browser. */
const CHART_BUSINESS_TZ = "Asia/Makassar"

function formatDayLabel(ymd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd
  const [y, mo, d] = ymd.split("-").map((s) => parseInt(s, 10))
  if (![y, mo, d].every((n) => Number.isFinite(n))) return ymd
  // Anchor tengah hari UTC untuk tanggal kalender agar tidak bergeser saat diformat ke WITA
  const anchor = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0))
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: CHART_BUSINESS_TZ,
  }).format(anchor)
}

type TooltipDatum = {
  name?: string
  value?: number | string
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipDatum[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  const rows = payload
    .filter((p) => p && (p.name === "revenue" || p.name === "notaTotal" || p.name === "orderCount"))
    .map((p) => {
      const name = p.name ?? ""
      let label = "Nota (jumlah)"
      let value: string
      if (name === "revenue") {
        label = "Pendapatan (bayar)"
        value = formatCurrency(Number(p.value ?? 0))
      } else if (name === "notaTotal") {
        label = "Nilai nota (semua status bayar)"
        value = formatCurrency(Number(p.value ?? 0))
      } else {
        value = String(Number(p.value ?? 0))
      }
      return { key: name, label, value, color: p.color ?? "" }
    })

  return (
    <div className="min-w-[180px] rounded-lg border border-border/80 bg-card p-3 text-card-foreground shadow-md">
      <p className="text-xs font-semibold text-muted-foreground">
        {label ? `Tanggal ${formatDayLabel(label)}` : "Detail"}
      </p>
      <div className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="text-muted-foreground">{r.label}</span>
            </div>
            <span className="font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RevenueChart({ data }: { data: DashboardChartPoint[] }) {
  const totalRevenue = data.reduce((sum, d) => sum + (Number.isFinite(d.revenue) ? d.revenue : 0), 0)
  const totalNotaValue = data.reduce((sum, d) => sum + (Number.isFinite(d.notaTotal) ? d.notaTotal : 0), 0)
  const totalOrders = data.reduce((sum, d) => sum + (Number.isFinite(d.orderCount) ? d.orderCount : 0), 0)

  const revenueColor = "hsl(var(--primary))"
  const notaValueColor = "hsl(262 83% 58%)"
  const ordersColor = "hsl(var(--foreground) / 0.55)"

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: revenueColor }} />
            Pendapatan: {formatCurrency(totalRevenue)}
          </Badge>
          <Badge variant="secondary" className="gap-2" title="Jumlah nominal semua nota di rentang ini, termasuk yang belum lunas.">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: notaValueColor }} />
            Nilai nota (termasuk belum lunas): {formatCurrency(totalNotaValue)}
          </Badge>
          <Badge variant="secondary" className="gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ordersColor }} />
            Jumlah nota: {new Intl.NumberFormat("id-ID").format(totalOrders)}
          </Badge>
        </div>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Garis nilai nota memakai total di nota (bukan pembayaran), sehingga tetap terhitung walau belum dibayar.
      </p>

      <div className={cn("h-72 w-full rounded-lg border border-border/60 bg-gradient-to-b from-background to-muted/20 p-2")}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 18, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={revenueColor} stopOpacity={0.95} />
                <stop offset="100%" stopColor={revenueColor} stopOpacity={0.15} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
            <XAxis
              dataKey="date"
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(v: string) => formatDayLabel(v)}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              yAxisId="revenue"
              tickFormatter={(v: number) => formatCompactNumber(Number(v))}
              width={56}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              allowDecimals={false}
              width={40}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              yAxisId="revenue"
              dataKey="revenue"
              name="revenue"
              fill={revenueColor}
              radius={[2, 2, 0, 0]}
              style={{ filter: "none" }}
            />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="notaTotal"
              name="notaTotal"
              stroke={notaValueColor}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orderCount"
              name="orderCount"
              stroke={ordersColor}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
