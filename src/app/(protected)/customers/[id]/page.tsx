import Link from "next/link"
import { notFound } from "next/navigation"

import { CustomerDeleteButton } from "@/components/customers/customer-delete-button"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { ToastQuery } from "@/components/shared/toast-query"
import { NavigateButton } from "@/components/shared/navigate-button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { backendFetch } from "@/lib/backend"
import { workflowLabel } from "@/components/shared/status-badge"
import { formatDeliveryServiceSummary } from "@/lib/delivery-service"

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { error?: string }
}) {
  const [customer, orders] = await Promise.all([
    backendFetch<{
      id: string
      name: string
      phone: string | null
      email: string | null
      address: string | null
      notes: string | null
      latitude: number | null
      longitude: number | null
    }>(`/api/v1/customers/${params.id}`),
    backendFetch<
      Array<{
        id: string
        invoiceNumber: string
        total: string
        workflowStatus: string
        deliveryServiceCategory?: string | null
        deliveryEstimateDays?: number | null
      }>
    >(`/api/v1/customers/${params.id}/orders?limit=10`),
  ]).catch(() => [null, []] as const)

  if (!customer) notFound()
  const safeOrders = orders ?? []

  const lat = customer.latitude != null ? Number(customer.latitude) : null
  const lng = customer.longitude != null ? Number(customer.longitude) : null
  const mapsHref = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null

  const errMsg = searchParams?.error?.trim()

  return (
    <div>
      <ToastQuery successParam="saved" successMessage="Perubahan disimpan" />
      <ToastQuery successParam="created" successMessage="Pelanggan berhasil ditambahkan" />
      <PageHeader title={customer.name} description="Detail pelanggan dan histori pesanan." />
      {errMsg ? (
        <Card className="mb-4 border-destructive/50 bg-destructive/5">
          <p className="text-sm text-destructive">{errMsg}</p>
        </Card>
      ) : null}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Telepon</p>
              <p className="font-medium">{customer.phone ?? "-"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/customers/${customer.id}/edit`}>
                <Button variant="outline">Edit</Button>
              </Link>
              <CustomerDeleteButton customerId={customer.id} />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{customer.email ?? "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Alamat</p>
              <p className="text-sm font-medium">{customer.address ?? "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Lokasi</p>
              {mapsHref ? (
                <a href={mapsHref} target="_blank" rel="noreferrer" className="text-sm font-medium underline underline-offset-4">
                  Buka di Google Maps
                </a>
              ) : (
                <p className="text-sm font-medium">-</p>
              )}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Catatan</p>
              <p className="text-sm font-medium">{customer.notes ?? "-"}</p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Total Nota (terakhir 10)</p>
          <p className="mt-2 text-3xl font-semibold">{safeOrders.length}</p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Percepatan</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <NavigateButton href={`/orders/${order.id}`} label={order.invoiceNumber} variant="secondary" />
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDeliveryServiceSummary(
                      order.deliveryServiceCategory,
                      order.deliveryEstimateDays,
                    )}
                  </TableCell>
                  <TableCell>{Number(order.total).toLocaleString("id-ID")}</TableCell>
                  <TableCell>{workflowLabel(order.workflowStatus)}</TableCell>
                </TableRow>
              ))}
              {safeOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Belum ada histori pesanan.
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
