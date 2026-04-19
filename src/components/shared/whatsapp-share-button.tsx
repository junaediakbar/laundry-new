"use client"

import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import {
  formatOrderItemQtyForShare,
  isM2AreaUnit,
  parseDimMeter,
} from "@/lib/order-item-display"
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

/** Rupiah seperti contoh struk: `Rp 18.000` (spasi setelah Rp). */
function formatRp(n: number) {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`
}

/** Hilangkan `*` dari teks pengguna agar tidak memutus pasangan bold WhatsApp (*teks*). */
function stripWaAsterisk(s: string) {
  return s.replace(/\*/g, "")
}

/** Angka untuk sisi kali (qty / luas): pemisah ribuan & desimal id-ID. */
function formatQtyId(n: number) {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

function buildItemWaBlock(it: WhatsAppItem, index1: number): string[] {
  const lines: string[] = []
  lines.push(`*${index1}. ${it.serviceName}*`)

  const unit = (it.unit || "").trim()
  const lm = parseDimMeter(it.lengthM ?? null)
  const wm = parseDimMeter(it.widthM ?? null)
  const detail = formatOrderItemQtyForShare({
    unit: it.unit,
    quantity: it.quantity,
    lengthM: it.lengthM,
    widthM: it.widthM,
  })

  const isCarpet = isM2AreaUnit(unit) && lm != null && wm != null
  lines.push(isCarpet ? `Ukuran: ${detail}` : `Jumlah: ${detail}`)

  if (it.unitPrice === undefined || String(it.unitPrice).trim() === "") {
    lines.push(`Total: *${formatRp(toNum(it.total))}*`)
    return lines
  }

  const unitPrice = toNum(it.unitPrice)
  const qty = toNum(it.quantity)
  const gross = lineGrossBeforeDiscount(qty, unitPrice)
  const disc = toNum(it.discount ?? "0")
  const tot = toNum(it.total)

  const unitSuffix = isM2AreaUnit(unit) ? "/m²" : unit ? `/${unit}` : ""
  lines.push(`*Harga satuan:* ${formatRp(unitPrice)}${unitSuffix}`)

  const qtyStr = formatQtyId(qty)
  lines.push(`Total: ${qtyStr} × ${formatRp(unitPrice)} = *${formatRp(gross)}*`)

  if (disc >= 0.5) {
    lines.push(`Diskon: ${formatRp(disc)}`)
    lines.push(`*Subtotal:* *${formatRp(tot)}*`)
  } else if (Math.abs(gross - tot) >= 0.5) {
    lines.push(`*Subtotal:* *${formatRp(tot)}*`)
  }

  return lines
}

function buildMessage(p: WhatsAppShareButtonProps, link: string) {
  const total = toNum(p.total)
  const paid = toNum(p.paidAmount)
  const remaining = Math.max(total - paid, 0)
  const items = p.items.slice(0, 10)

  const headerLines = [
    `*Trees Clean Laundry*`,
    ``,
    `*Invoice:* ${p.invoiceNumber}`,
    `*Tanggal masuk:* ${formatDate(p.receivedDate)}`,
  ]
  if (p.completedDate) {
    headerLines.push(`*Tanggal selesai:* ${formatDate(p.completedDate)}`)
  }

  const itemBlocks = items.map((it, i) => buildItemWaBlock(it, i + 1).join("\n"))
  let itemsText = itemBlocks.join("\n\n")
  if (p.items.length > items.length) {
    itemsText += `\n... +${p.items.length - items.length} item lainnya`
  }

  const lines = [
    ...headerLines,
    ``,
    itemsText,
    ``,
    `*Total tagihan:* *${formatRp(total)}*`,
    `*Dibayar:* ${formatRp(paid)}`,
    `*Sisa pembayaran:* *${formatRp(remaining)}*`,
    ``,
    `*Status pembayaran:* ${paymentLabel(p.paymentStatus)}`,
    `*Status proses:* ${workflowLabel(p.workflowStatus)}`,
    ``,
    `*Link struk:*`,
    link,
    ``,
    `Terima kasih.`,
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
