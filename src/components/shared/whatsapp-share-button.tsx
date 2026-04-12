"use client"

import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { formatOrderItemQtyForShare } from "@/lib/order-item-display"
import { paymentLabel, workflowLabel } from "@/components/shared/status-badge"
import { Share2 } from "lucide-react"

type WhatsAppItem = {
  serviceName: string
  unit: string
  quantity: string
  total: string
  /** Untuk rincian subtotal & baris diskon di struk WA */
  unitPrice?: string
  discount?: string
  lengthM?: string | null
  widthM?: string | null
}

type WhatsAppShareButtonProps = {
  invoiceNumber: string
  customerName: string
  customerPhone?: string | null
  receivedDate: string
  completedDate?: string | null
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

function lineGrossBeforeDiscount(quantity: number, unitPrice: number) {
  return Math.max(quantity * unitPrice, 0)
}

function formatPercentId(pct: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pct)
}

function itemDetailLine(it: WhatsAppItem): string {
  return formatOrderItemQtyForShare({
    unit: it.unit,
    quantity: it.quantity,
    lengthM: it.lengthM,
    widthM: it.widthM,
  })
}

function buildMessage(p: WhatsAppShareButtonProps, link: string) {
  const total = toNum(p.total)
  const paid = toNum(p.paidAmount)
  const remaining = Math.max(total - paid, 0)
  const items = p.items.slice(0, 10)

  const headerLines = [
    `*Trees Clean Laundry*`,
    `Invoice: ${p.invoiceNumber}`,
    `Pelanggan: ${p.customerName}`,
    `Tanggal masuk: ${formatDate(p.receivedDate)}`,
  ]
  if (p.completedDate) {
    headerLines.push(`Tanggal selesai: ${formatDate(p.completedDate)}`)
  }

  const allItemsHavePricing =
    p.items.length > 0 && p.items.every((it) => it.unitPrice !== undefined)

  let grossSum = 0
  let discountSum = 0
  if (allItemsHavePricing) {
    for (const it of p.items) {
      const qty = toNum(it.quantity)
      const unitPrice = toNum(it.unitPrice ?? "0")
      grossSum += lineGrossBeforeDiscount(qty, unitPrice)
      discountSum += toNum(it.discount ?? "0")
    }
  }

  const itemLines = items.map((it, i) => {
    const detail = itemDetailLine(it)
    const mid = detail ? ` ( ${detail} )` : ""
    return `• ${i + 1}. ${it.serviceName}${mid} = ${formatCurrency(toNum(it.total))}`
  })
  if (p.items.length > items.length) {
    itemLines.push(`... +${p.items.length - items.length} item lainnya`)
  }

  const totalLines: string[] = []
  if (allItemsHavePricing && grossSum > 0 && discountSum > 0) {
    const pct = (discountSum / grossSum) * 100
    totalLines.push(`Total harga : ${formatCurrency(grossSum)}`)
    totalLines.push(`Diskon ${formatPercentId(pct)}% = ${formatCurrency(discountSum)}`)
    totalLines.push(`Total: ${formatCurrency(total)}`)
  } else if (allItemsHavePricing && grossSum > 0) {
    totalLines.push(`Total harga : ${formatCurrency(grossSum)}`)
    totalLines.push(`Total: ${formatCurrency(total)}`)
  } else {
    totalLines.push(`Total harga : ${formatCurrency(total)}`)
    totalLines.push(`Total: ${formatCurrency(total)}`)
  }

  const lines = [
    ...headerLines,
    ``,
    `Item:`,
    ...itemLines,
    ``,
    ...totalLines,
    ``,
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
