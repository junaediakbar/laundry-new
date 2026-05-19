"use client"

import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { formatReceiptDateTime } from "@/lib/format"
import {
  formatOrderItemQtyForShare,
  isM2AreaUnit,
  parseDimMeter,
} from "@/lib/order-item-display"
import { paymentLabel, workflowLabel } from "@/components/shared/status-badge"
import { Share2 } from "lucide-react"

function laundryBrandLine(notaNumber: number) {
  if (notaNumber > 0) return `Trees Clean Laundry - ${notaNumber}`
  return "Trees Clean Laundry"
}

const TERMS_AND_CONDITIONS = `*Syarat dan Ketentuan Laundry:

PERHATIAN:
1. Pengambilan barang harap menunjukkan nota
2. Penyelesaian cucian reguler 5 hari dan maksimal 7 hari
3. Layanan antar jemput, pengantaran menyesuaikan jalur antar jemput/jadwal delivery
4. Layanan antar jemput hangus jika setelah 1 (satu) bulan (terhitung tanggal saat cucian diterima) dan terjadi gagal pengantaran karena belum dibayar/atau tidak ada pihak customer di tempat pengantaran
5. 1 (satu) bulan terhitung dari tanggal cucian diterima barang belum diambil/gagal antar, dikenakan biaya penitipan 10% dari harga cucian, dan jika rusak/hilang tidak diganti
6. Barang yang akan dilaundry mohon diperiksa/dikontrol dulu bila ada cacat/sudah rapuh/lapuk agar diberitahukan kepada kami, kerusakan akibat barang yang sudah rapuh/lapuk bukan tanggung jawab kami
7. Barang hilang/rusak karena proses pengerjaan yang lalai diganti maksimal 2 (dua) x ongkos cuci barang yang dimaksud
8. Hak klaim berlaku 24 jam setelah barang diambil
9. Setiap konsumen dianggap setuju dengan isi syarat & ketentuan tersebut diatas`

type WhatsAppItem = {
  serviceName: string
  unit: string
  quantity: string
  total: string
  unitPrice?: string
  discount?: string
  lengthM?: string | null
  widthM?: string | null
}

type WhatsAppShareButtonProps = {
  notaNumber: number
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

/** Angka untuk sisi kali (qty / luas): pemisah ribuan & desimal id-ID. */
function formatQtyId(n: number) {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

/** Tampilan nomor WA di struk: `62 821-9229-9293`. */
function formatPhoneDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return phone.trim()

  let national = digits
  if (national.startsWith("62")) national = national.slice(2)
  else if (national.startsWith("0")) national = national.slice(1)

  if (national.length < 9) return phone.trim()

  const p1 = national.slice(0, 3)
  const p2 = national.slice(3, 7)
  const p3 = national.slice(7)
  return `62 ${p1}-${p2}-${p3}`
}

function buildItemWaBlock(it: WhatsAppItem, index1: number): string[] {
  const lines: string[] = []
  lines.push(`${index1}. ${it.serviceName}`)

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
    lines.push(`Subtotal: ${formatRp(toNum(it.total))}`)
    return lines
  }

  const unitPrice = toNum(it.unitPrice)
  const qty = isCarpet && lm != null && wm != null ? lm * wm : toNum(it.quantity)
  const gross = lineGrossBeforeDiscount(qty, unitPrice)
  const disc = toNum(it.discount ?? "0")
  const tot = toNum(it.total)

  const unitSuffix = isM2AreaUnit(unit) ? "/m²" : unit ? `/${unit}` : ""
  lines.push(`Harga satuan: ${formatRp(unitPrice)}${unitSuffix}`)

  const qtyStr = formatQtyId(qty)
  lines.push(`Total: ${qtyStr} × ${formatRp(unitPrice)} = ${formatRp(gross)}`)

  if (disc >= 0.5) {
    lines.push(`Diskon: ${formatRp(disc)}`)
  }
  lines.push(`Subtotal: ${formatRp(tot)}`)

  return lines
}

export function buildReceiptWhatsAppMessage(p: WhatsAppShareButtonProps): string {
  const total = toNum(p.total)
  const paid = toNum(p.paidAmount)
  const remaining = Math.max(total - paid, 0)
  const items = p.items.slice(0, 10)

  const headerLines = [laundryBrandLine(p.notaNumber), `Kepada Yth. ${p.customerName}`]
  if (p.customerPhone?.trim()) {
    headerLines.push(formatPhoneDisplay(p.customerPhone))
  }
  headerLines.push(
    `Invoice: ${p.invoiceNumber}`,
    `Tanggal masuk: ${formatReceiptDateTime(p.receivedDate)}`,
  )
  if (p.completedDate) {
    headerLines.push(`Tanggal selesai: ${formatReceiptDateTime(p.completedDate)}`)
  }

  const itemBlocks = items.map((it, i) => buildItemWaBlock(it, i + 1).join("\n"))
  let itemsText = itemBlocks.join("\n\n")
  if (p.items.length > items.length) {
    itemsText += `\n... +${p.items.length - items.length} item lainnya`
  }

  const lines = [
    ...headerLines,
    "",
    itemsText,
    "",
    `Total tagihan: ${formatRp(total)}`,
    "",
    `Dibayar: ${formatRp(paid)}`,
    `Sisa pembayaran: ${formatRp(remaining)}`,
    "",
    `Status pembayaran: ${paymentLabel(p.paymentStatus)}`,
    `Status proses: ${workflowLabel(p.workflowStatus)}`,
    "",
    "Terima kasih.",
    "",
    TERMS_AND_CONDITIONS,
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

export function WhatsAppShareButton({ label = "Share WA", ...rest }: WhatsAppShareButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="h-10 w-10 px-0"
      aria-label={label}
      title={label}
      onClick={() => {
        const text = buildReceiptWhatsAppMessage(rest)
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
