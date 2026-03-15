import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"

export default async function DashboardPage() {
  const [customerCount, orderCount, unpaidCount, revenueResult] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: { not: "paid" } } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
  ])

  const totalRevenue = Number(revenueResult._sum.amount ?? 0)

  const cards = [
    { title: "Total Pelanggan", value: `${customerCount}` },
    { title: "Total Nota", value: `${orderCount}` },
    { title: "Nota Belum Lunas", value: `${unpaidCount}` },
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
