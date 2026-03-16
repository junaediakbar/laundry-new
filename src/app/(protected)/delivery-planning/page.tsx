import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { prisma } from "@/lib/prisma"

type DeliveryPlanRow = {
  id: string
  name: string
  plannedDate: Date
  _count: { stops: number }
}

export default async function DeliveryPlanningPage() {
  const prismaDelivery = prisma as unknown as {
    deliveryPlan: {
      findMany(args: unknown): Promise<DeliveryPlanRow[]>
    }
  }

  const plans = await prismaDelivery.deliveryPlan.findMany({
    orderBy: { plannedDate: "desc" },
    take: 50,
    include: {
      _count: { select: { stops: true } },
    },
  })

  return (
    <div>
      <PageHeader title="Perencanaan Pengiriman" actionHref="/delivery-planning/new" actionLabel="Buat Rencana" />

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Stop</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{formatDate(plan.plannedDate)}</TableCell>
                  <TableCell>{plan._count.stops}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/delivery-planning/${plan.id}`}>
                      <Button size="sm" variant="outline">
                        Detail
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}

              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Belum ada rencana pengiriman.
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

