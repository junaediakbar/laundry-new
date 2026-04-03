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
  revenue: number
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function parseYmdToDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(`${value}T00:00:00+08:00`)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function formatDayLabel(ymd: string) {
  const d = parseYmdToDate(ymd)
  if (!d) return ymd
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(d)
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
    .filter((p) => p && (p.name === "revenue" || p.name === "orderCount"))
    .map((p) => ({
      key: p.name ?? "",
      label: p.name === "revenue" ? "Pendapatan" : "Nota",
      value:
        p.name === "revenue"
          ? formatCurrency(Number(p.value ?? 0))
          : String(Number(p.value ?? 0)),
      color: p.color ?? "",
    }))

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
  const totalOrders = data.reduce((sum, d) => sum + (Number.isFinite(d.orderCount) ? d.orderCount : 0), 0)

  const revenueColor = "hsl(var(--primary))"
  const ordersColor = "hsl(var(--foreground) / 0.55)"

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: revenueColor }} />
            Pendapatan: {formatCurrency(totalRevenue)}
          </Badge>
          <Badge variant="secondary" className="gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ordersColor }} />
            Nota: {new Intl.NumberFormat("id-ID").format(totalOrders)}
          </Badge>
        </div>
      </div>

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
              fill={revenueColor}
              radius={[2, 2, 0, 0]}
              style={{ filter: "none" }}
            />
            <Line yAxisId="orders" type="monotone" dataKey="orderCount" stroke={ordersColor} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
