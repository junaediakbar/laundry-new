import { formatCurrency } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { backendFetch } from "@/lib/backend"

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
    { title: "Total Pelanggan", value: `${summary.customerCount}` },
    { title: "Total Nota", value: `${summary.orderCount}` },
    { title: "Nota Belum Lunas", value: `${summary.unpaidCount}` },
    { title: "Pendapatan", value: formatCurrency(totalRevenue) },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan operasional laundry harian." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
