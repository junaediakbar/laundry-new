"use client"

import { useEffect, useState } from "react"

import { useCreateOrderPricing } from "@/components/orders/create-order-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deliveryEstimateDaysFor } from "@/lib/delivery-service"

function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * Tanggal masuk + selesai. Tanggal selesai terisi otomatis dari tanggal masuk +
 * estimasi (hari kalender) kategori percepatan yang dipilih, dan tak pernah kosong.
 * Masih bisa diubah manual sampai kategori/tanggal masuk berubah.
 */
export function OrderScheduleFields() {
  const pricing = useCreateOrderPricing()
  const category = pricing?.deliveryCategory ?? "reguler"
  const [receivedDate, setReceivedDate] = useState(() => toLocalInput(new Date()))
  const [completedDate, setCompletedDate] = useState("")

  useEffect(() => {
    const days = deliveryEstimateDaysFor(category) ?? 0
    const base = receivedDate ? new Date(receivedDate) : new Date()
    if (Number.isNaN(base.getTime())) return
    base.setDate(base.getDate() + days)
    setCompletedDate(toLocalInput(base))
  }, [category, receivedDate])

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="receivedDate">Tanggal &amp; jam masuk</Label>
        <Input
          id="receivedDate"
          name="receivedDate"
          type="datetime-local"
          value={receivedDate}
          onChange={(e) => setReceivedDate(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="completedDate">Tanggal &amp; jam selesai</Label>
        <Input
          id="completedDate"
          name="completedDate"
          type="datetime-local"
          value={completedDate}
          onChange={(e) => setCompletedDate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Terisi otomatis dari layanan percepatan. Bisa diubah manual.
        </p>
      </div>
    </div>
  )
}
