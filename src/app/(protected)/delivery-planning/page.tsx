import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { ToastQuery } from "@/components/shared/toast-query"
import { DeliveryPlanDeleteButton } from "@/components/delivery-planning/delivery-plan-delete-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { backendFetch } from "@/lib/backend"

type DeliveryPlanRow = {
  id: string
  name: string
  plannedDate: string
  stopCount: number
}

export default async function DeliveryPlanningPage({
  searchParams,
}: {
  searchParams?: { error?: string; created?: string }
}) {
  const err = searchParams?.error?.trim() ?? ""
  const plans =
    (await backendFetch<DeliveryPlanRow[]>(`/api/v1/delivery-plans?limit=50`).catch(() => [])) ?? []

  return (
    <div>
      <ToastQuery successParam="created" successMessage="Rencana pengiriman berhasil dibuat" />
      <PageHeader title="Perencanaan Pengiriman" actionHref="/delivery-planning/new" actionLabel="Buat Rencana" />
      {err ? <p className="mb-4 text-sm text-red-600">{err}</p> : null}

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
                  <TableCell>{plan.stopCount}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link href={`/delivery-planning/${plan.id}`}>
                        <Button size="sm" variant="outline">
                          Detail
                        </Button>
                      </Link>
                      <DeliveryPlanDeleteButton planId={plan.id} />
                    </div>
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
