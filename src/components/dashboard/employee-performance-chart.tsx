"use client"

import { useRouter } from "next/navigation"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts"

import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

export type EmployeePerformancePoint = {
  employeeId: string
  employeeName: string
  pickupAmount: number
  workAmount: number
  totalAmount: number
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="min-w-[200px] rounded-lg border border-border/80 bg-card p-3 text-card-foreground shadow-md">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label ?? "Detail"}</p>
      <div className="space-y-1.5">
        {payload.map((p, i) => {
          const name = p.name ?? ""
          let label = ""
          if (name === "pickupAmount") label = "Pickup / Antar"
          else if (name === "workAmount") label = "Kerja Proses"
          else if (name === "totalAmount") label = "Total"
          else label = name

          return (
            <div key={i} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-muted-foreground">{label}</span>
              </div>
              <span className="font-semibold">{formatCurrency(Number(p.value ?? 0))}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EmployeePerformanceChart({
  data,
  month,
}: {
  data: EmployeePerformancePoint[]
  month?: string
}) {
  const router = useRouter()

  const chartData = data.map((d) => ({
    employeeId: d.employeeId,
    name: d.employeeName.length > 20 ? d.employeeName.slice(0, 18) + "..." : d.employeeName,
    fullName: d.employeeName,
    pickupAmount: d.pickupAmount,
    workAmount: d.workAmount,
    totalAmount: d.totalAmount,
  }))

  const handleBarClick = (data: { employeeId: string }) => {
    if (data.employeeId) {
      const params = new URLSearchParams()
      params.set("employeeId", data.employeeId)
      if (month) {
        params.set("month", month)
      }
      router.push(`/employees/performance?${params.toString()}`)
    }
  }

  const pickupColor = "hsl(199 89% 48%)"
  const workColor = "hsl(262 83% 58%)"
  const totalColor = "hsl(var(--primary))"

  const totalAll = chartData.reduce((sum, d) => sum + d.totalAmount, 0)

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-muted-foreground">Total performa tim:</span>
          <span className="font-semibold text-primary">{formatCurrency(totalAll)}</span>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 12, left: 8, bottom: 8 }} layout="vertical" barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatCompactNumber(Number(v))}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value: string) => {
                const item = chartData.find((d) => d.name === value)
                const nameLen = item?.name.length ?? 0
                if (nameLen > 18 && item?.name) {
                  return item.name.slice(0, 16) + ".."
                }
                return value
              }}
            />
            <Tooltip
              content={<ChartTooltip />}
              labelFormatter={(value: string) => {
                const item = chartData.find((d) => d.name === value)
                return item?.fullName ?? value
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              formatter={(value: string) => {
                if (value === "pickupAmount") return "Pickup / Antar"
                if (value === "workAmount") return "Kerja Proses"
                if (value === "totalAmount") return "Total"
                return value
              }}
            />
            <Bar
              dataKey="totalAmount"
              name="totalAmount"
              fill={totalColor}
              radius={[0, 4, 4, 0]}
              onClick={handleBarClick}
              cursor="pointer"
              className="hover:opacity-80"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Klik pada bar untuk melihat detail pekerjaan berdasarkan nota order.
      </p>

      {chartData.length === 0 && (
        <div className="flex h-80 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Belum ada data performa karyawan pada periode ini.
        </div>
      )}
    </div>
  )
}
