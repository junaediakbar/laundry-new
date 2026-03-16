"use client"

import { useState, useTransition } from "react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

type EventKey = "invoice_created" | "shipping_soon" | "pickup_ready"

type PreviewResult = {
  ok: true
  dryRun: true
  orderId: string
  eventKey: EventKey
  toPhone: { raw: string; e164: string }
  template: { name: string; languageCode: string }
  params: { body: string[] }
}

export function WhatsAppTestForm() {
  const [orderId, setOrderId] = useState("")
  const [eventKey, setEventKey] = useState<EventKey>("invoice_created")
  const [pending, startTransition] = useTransition()
  const [lastResponse, setLastResponse] = useState<string>("")
  const [preview, setPreview] = useState<PreviewResult | null>(null)

  return (
    <Card className="max-w-xl">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setLastResponse("")
          setPreview(null)

          startTransition(async () => {
            try {
              const response = await fetch("/api/whatsapp/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, eventKey }),
              })

              const text = await response.text()
              setLastResponse(text)

              if (!response.ok) {
                toast.error("Gagal membuat preview")
                return
              }

              const json = JSON.parse(text) as PreviewResult
              setPreview(json)
            } catch {
              toast.error("Gagal membuat preview")
            }
          })
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="orderId">Order ID</Label>
          <Input
            id="orderId"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="uuid..."
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventKey">Event</Label>
          <Select
            id="eventKey"
            value={eventKey}
            onChange={(e) => setEventKey(e.target.value as EventKey)}
            disabled={pending}
          >
            <option value="invoice_created">invoice_created</option>
            <option value="shipping_soon">shipping_soon</option>
            <option value="pickup_ready">pickup_ready</option>
          </Select>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Memuat..." : "Preview Pesan"}
        </Button>

        {lastResponse ? (
          <pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">{lastResponse}</pre>
        ) : null}

        {preview ? (
          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            <p className="text-sm font-semibold">Konfirmasi Pengiriman</p>
            <div className="grid gap-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground">Event</span>
                <span className="font-medium">{preview.eventKey}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground">Template</span>
                <span className="font-medium">
                  {preview.template.name} ({preview.template.languageCode})
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground">Ke</span>
                <span className="font-medium">
                  {preview.toPhone.raw} → {preview.toPhone.e164}
                </span>
              </div>
            </div>

            <div className="rounded-md border bg-background p-3">
              <p className="text-xs font-semibold text-muted-foreground">Parameter (Body)</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                {preview.params.body.map((p, i) => (
                  <li key={i} className="break-all">
                    {p}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setPreview(null)
                }}
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    setLastResponse("")
                    try {
                      const response = await fetch("/api/whatsapp/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId: preview.orderId, eventKey: preview.eventKey }),
                      })

                      const text = await response.text()
                      setLastResponse(text)

                      if (!response.ok) {
                        toast.error("Gagal mengirim WhatsApp")
                        return
                      }

                      toast.success("WhatsApp terkirim")
                      setPreview(null)
                    } catch {
                      toast.error("Gagal mengirim WhatsApp")
                    }
                  })
                }}
              >
                Konfirmasi & Kirim
              </Button>
            </div>
          </div>
        ) : null}
      </form>
    </Card>
  )
}
