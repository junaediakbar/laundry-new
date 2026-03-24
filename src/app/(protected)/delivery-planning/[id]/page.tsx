import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { DeliveryPlanDeleteButton } from "@/components/delivery-planning/delivery-plan-delete-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildGoogleMapsDirectionsUrl } from "@/lib/geo"
import { formatDate } from "@/lib/format"
import { backendFetch } from "@/lib/backend"

type PlanDetail = {
  id: string
  name: string
  plannedDate: string
  startAddress: string | null
  startLat: number | null
  startLng: number | null
  stops: Array<{
    id: string
    sequence: number
    distanceKm: number | null
    customer: {
      id: string
      name: string
      address: string | null
      latitude: number | null
      longitude: number | null
    }
  }>
}

export default async function DeliveryPlanDetailPage({ params }: { params: { id: string } }) {
  let plan: PlanDetail | null = null
  try {
    plan = await backendFetch<PlanDetail>(`/api/v1/delivery-plans/${params.id}`)
  } catch {
    plan = null
  }

  if (!plan) {
    return (
      <div>
        <PageHeader title="Rencana pengiriman tidak ditemukan" />
        <Link href="/delivery-planning">
          <Button variant="outline">Kembali</Button>
        </Link>
      </div>
    )
  }

  const startLat = plan.startLat != null ? Number(plan.startLat) : -0.8986
  const startLng = plan.startLng != null ? Number(plan.startLng) : 119.8707
  const startHref =
    plan.startLat != null && plan.startLng != null ? `https://www.google.com/maps?q=${startLat},${startLng}` : null

  const stopLocations = plan.stops
    .map((s) => {
      const lat = s.customer.latitude != null ? Number(s.customer.latitude) : null
      const lng = s.customer.longitude != null ? Number(s.customer.longitude) : null
      if (lat == null || lng == null) return null
      return { lat, lng }
    })
    .filter((v): v is { lat: number; lng: number } => v != null)

  const mapsUrl = buildGoogleMapsDirectionsUrl({ lat: startLat, lng: startLng }, stopLocations)

  return (
    <div>
      <PageHeader title={plan.name} description={`Tanggal: ${formatDate(plan.plannedDate)}`} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/delivery-planning">
          <Button variant="outline">Kembali</Button>
        </Link>
        <DeliveryPlanDeleteButton planId={plan.id} />
        {mapsUrl ? (
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <Button>Open Route (Google Maps)</Button>
          </a>
        ) : null}
      </div>

      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Titik Mulai</p>
            <p className="mt-1 text-sm font-medium">{plan.startAddress ?? "-"}</p>
            {startHref ? (
              <a href={startHref} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs underline underline-offset-4">
                Buka di Google Maps
              </a>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">-</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Jumlah Stop</p>
            <p className="mt-1 text-sm font-medium">{plan.stops.length}</p>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Jarak dari sebelumnya (km)</TableHead>
                <TableHead className="w-[1%] whitespace-nowrap">Maps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.stops.map((stop) => {
                const lat = stop.customer.latitude != null ? Number(stop.customer.latitude) : null
                const lng = stop.customer.longitude != null ? Number(stop.customer.longitude) : null
                const href = lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null
                const distance = stop.distanceKm != null ? Number(stop.distanceKm) : null

                return (
                  <TableRow key={stop.id}>
                    <TableCell className="font-medium">{stop.sequence}</TableCell>
                    <TableCell className="font-medium">{stop.customer.name}</TableCell>
                    <TableCell>{stop.customer.address ?? "-"}</TableCell>
                    <TableCell>{distance != null ? distance.toFixed(2) : "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {href ? (
                        <a href={href} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}

              {plan.stops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Tidak ada stop.
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
