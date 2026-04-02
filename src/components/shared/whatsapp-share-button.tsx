"use client"

import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { paymentLabel, workflowLabel } from "@/components/shared/status-badge"
import { Share2 } from "lucide-react"

type WhatsAppItem = {
  serviceName: string
  unit: string
  quantity: string
  total: string
}

type WhatsAppShareButtonProps = {
  invoiceNumber: string
  customerName: string
  customerPhone?: string | null
  receivedDate: string
  items: WhatsAppItem[]
  total: string
  paidAmount: string
  paymentStatus: string
  workflowStatus: string
  url?: string
  label?: string
}

function toNum(v: string) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function buildMessage(p: WhatsAppShareButtonProps, link: string) {
  const total = toNum(p.total)
  const paid = toNum(p.paidAmount)
  const remaining = Math.max(total - paid, 0)
  const items = p.items.slice(0, 10)

  const lines = [
    `*Trees Clean Laundry*`,
    `Invoice: ${p.invoiceNumber}`,
    `Pelanggan: ${p.customerName}`,
    `Tanggal masuk: ${formatDate(p.receivedDate)}`,
    ``,
    `Item:`,
    ...items.map((it, i) => `- ${i + 1}. ${it.serviceName} (${it.quantity} ${it.unit}) = ${formatCurrency(toNum(it.total))}`),
    ...(p.items.length > items.length ? [`... +${p.items.length - items.length} item lainnya`] : []),
    ``,
    `Total: ${formatCurrency(total)}`,
    `Dibayar: ${formatCurrency(paid)}`,
    `Sisa: ${formatCurrency(remaining)}`,
    `Status pembayaran: ${paymentLabel(p.paymentStatus)}`,
    `Status workflow: ${workflowLabel(p.workflowStatus)}`,
    ``,
    `Link struk: ${link}`,
  ]

  return lines.join("\n")
}

function normalizeWhatsAppPhone(phone: string) {
  let p = phone.trim()
  if (!p) return null
  p = p.replace(/[^\d+]/g, "")
  if (p.startsWith("+")) p = p.slice(1)
  if (p.startsWith("00")) p = p.slice(2)
  if (p.startsWith("0")) p = `62${p.slice(1)}`
  if (!/^\d{8,16}$/.test(p)) return null
  return p
}

export function WhatsAppShareButton({
  label = "Share WA",
  url,
  ...rest
}: WhatsAppShareButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="h-10 w-10 px-0"
      aria-label={label}
      title={label}
      onClick={() => {
        const link = url || window.location.href
        const text = buildMessage({ ...rest, url: link, label }, link)
        try {
          const phone = rest.customerPhone ? normalizeWhatsAppPhone(rest.customerPhone) : null
          const wa = phone
            ? `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`
          window.open(wa, "_blank", "noopener,noreferrer")
        } catch {
          toast.error("Gagal membuka WhatsApp")
        }
      }}
    >
      <Share2 className="w-4 h-4" />
    </Button>
  )
}
