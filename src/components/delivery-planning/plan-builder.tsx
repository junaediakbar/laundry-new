"use client"

import { useMemo, useState, useTransition } from "react"

import { createDeliveryPlanAction } from "@/actions/delivery-planning-actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type CustomerOption = {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
}

type PlanBuilderProps = {
  customers: CustomerOption[]
  defaultStartLat?: number
  defaultStartLng?: number
}

function todayIso() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = `${now.getMonth() + 1}`.padStart(2, "0")
  const dd = `${now.getDate()}`.padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function PlanBuilder({ customers, defaultStartLat = -0.8986, defaultStartLng = 119.8707 }: PlanBuilderProps) {
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return customers
    return customers.filter((c) => (c.name + " " + (c.address ?? "")).toLowerCase().includes(query))
  }, [customers, q])

  const selectedCount = selectedIds.length
  const serialized = useMemo(() => JSON.stringify(selectedIds), [selectedIds])

  return (
    <Card className="p-6">
      <form
        className="space-y-4"
        action={(formData) => {
          startTransition(async () => {
            await createDeliveryPlanAction(formData)
          })
        }}
      >
        <input type="hidden" name="customerIds" value={serialized} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Rencana</Label>
            <Input id="name" name="name" required placeholder="Pengiriman Palu Hari Ini" disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plannedDate">Tanggal</Label>
            <Input id="plannedDate" name="plannedDate" type="date" required defaultValue={todayIso()} disabled={pending} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startAddress">Titik Mulai (opsional)</Label>
          <Input id="startAddress" name="startAddress" placeholder="Workshop / Gudang" disabled={pending} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startLat">Start Latitude</Label>
            <Input
              id="startLat"
              name="startLat"
              type="number"
              step="0.000001"
              required
              defaultValue={defaultStartLat}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startLng">Start Longitude</Label>
            <Input
              id="startLng"
              name="startLng"
              type="number"
              step="0.000001"
              required
              defaultValue={defaultStartLng}
              disabled={pending}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Pilih Lokasi Pengiriman</p>
            <p className="text-xs text-muted-foreground">{selectedCount} dipilih</p>
          </div>
          <Button type="submit" disabled={pending || selectedCount === 0}>
            {pending ? "Menyimpan..." : "Buat Rencana"}
          </Button>
        </div>

        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pelanggan / alamat..." disabled={pending} />
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setQ("")
            }}
          >
            Reset
          </Button>
        </div>

        <div className="max-h-[420px] overflow-auto rounded-md border">
          <div className="divide-y">
            {filtered.map((c) => {
              const checked = selectedIds.includes(c.id)
              const mapsHref = `https://www.google.com/maps?q=${c.latitude},${c.longitude}`
              return (
                <label key={c.id} className="flex cursor-pointer items-start gap-3 p-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={pending}
                    onChange={(e) => {
                      const next = e.target.checked
                      setSelectedIds((prev) => {
                        if (next) return [...prev, c.id]
                        return prev.filter((id) => id !== c.id)
                      })
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.address ?? "-"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.latitude}, {c.longitude} •{" "}
                      <a href={mapsHref} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                        Maps
                      </a>
                    </p>
                  </div>
                </label>
              )
            })}

            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Tidak ada pelanggan yang cocok.</div>
            ) : null}
          </div>
        </div>
      </form>
    </Card>
  )
}
