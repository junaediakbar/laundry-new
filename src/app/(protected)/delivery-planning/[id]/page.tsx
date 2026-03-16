import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildGoogleMapsDirectionsUrl } from "@/lib/geo"
import { formatDate } from "@/lib/format"
import { prisma } from "@/lib/prisma"

type PlanDetail = {
  id: string
  name: string
  plannedDate: Date
  startAddress: string | null
  startLat: { toString(): string } | number | null
  startLng: { toString(): string } | number | null
  stops: Array<{
    id: string
    sequence: number
    distanceKm: { toString(): string } | number | null
    customer: {
      id: string
      name: string
      address: string | null
      latitude: { toString(): string } | number | null
      longitude: { toString(): string } | number | null
    }
  }>
}

export default async function DeliveryPlanDetailPage({ params }: { params: { id: string } }) {
  const prismaDelivery = prisma as unknown as {
    deliveryPlan: {
      findUnique(args: unknown): Promise<PlanDetail | null>
    }
  }

  const plan = await prismaDelivery.deliveryPlan.findUnique({
    where: { id: params.id },
    include: {
      stops: {
        orderBy: { sequence: "asc" },
        include: { customer: true },
      },
    },
  })

  if (!plan) {
    notFound()
  }

  const startLat = plan.startLat != null ? Number(plan.startLat) : -0.8986
  const startLng = plan.startLng != null ? Number(plan.startLng) : 119.8707

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
            <p className="mt-1 text-xs text-muted-foreground">
              {startLat}, {startLng}
            </p>
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

