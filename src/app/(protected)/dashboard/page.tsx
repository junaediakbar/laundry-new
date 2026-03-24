import { AlertCircle, ReceiptText, TrendingUp, Users } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { backendFetch } from "@/lib/backend"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

export default async function DashboardPage() {
  const summary = await backendFetch<{
    customerCount: number
    orderCount: number
    unpaidCount: number
    totalRevenue: string
  }>("/api/v1/dashboard/summary").catch(() => ({
    customerCount: 0,
    orderCount: 0,
    unpaidCount: 0,
    totalRevenue: "0",
  }))

  const totalRevenue = Number(summary.totalRevenue ?? 0)

  const cards = [
    {
      title: "Total Pelanggan",
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
    </div>
  )
}
