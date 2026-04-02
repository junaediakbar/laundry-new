import Link from "next/link"
import { notFound } from "next/navigation"

import { CopyLinkButton } from "@/components/shared/copy-link-button"
import { PrintButton } from "@/components/shared/print-button"
import { WhatsAppShareButton } from "@/components/shared/whatsapp-share-button"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { resolveOrderImageUrls } from "@/lib/order-images"
import { BackendFetchError, backendFetch } from "@/lib/backend"
import { workflowLabel, paymentLabel } from "@/components/shared/status-badge"

function lineGrossBeforeDiscount(quantity: number, unitPrice: number) {
  return Math.max(quantity * unitPrice, 0)
}

/** Persen diskon terhadap harga asli baris; null jika tidak relevan. */
function discountPercentOfGross(gross: number, discount: number): number | null {
  if (gross <= 0 || discount <= 0) return null
  const pct = (discount / gross) * 100
  if (!Number.isFinite(pct)) return null
  return Math.round(pct * 100) / 100
}

function formatPercentId(pct: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pct)
}

type PublicReceipt = {
  publicToken: string
  invoiceNumber: string
  customerName: string
  customerPhone?: string | null
  total: string
  paidAmount: string
  paymentStatus: string
  workflowStatus: string
  receivedDate: string
  completedDate?: string | null
  pickupDate?: string | null
  image?: string | null
  images?: string[] | null
  note?: string | null
  items: Array<{
    serviceName: string
    unit: string
    quantity: string
    unitPrice: string
    discount: string
    total: string
  }>
}

export default async function ReceiptPage({ params }: { params: { token: string } }) {
  let receipt: PublicReceipt | null = null
  try {
    receipt = await backendFetch<PublicReceipt>(`/api/v1/public/receipts/${params.token}`, { skipAuth: true })
  } catch (e) {
    if (e instanceof BackendFetchError && e.status === 404) notFound()
    receipt = null
  }

  if (!receipt) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <Card>
          <p className="text-sm text-muted-foreground">Nota tidak dapat dimuat.</p>
          <div className="mt-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const backendBase = (process.env.BACKEND_BASE_URL || "http://localhost:8080").replace(/\/$/, "")
  const imageUrls = resolveOrderImageUrls(backendBase, receipt.image, receipt.images)

  const total = Number(receipt.total)
  const paid = Number(receipt.paidAmount)
  const remaining = Math.max(total - paid, 0)

  return (
    <div className="mx-auto max-w-xl p-4">
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-lg font-semibold">Trees Clean Laundry</p>
            <p className="break-all text-sm text-muted-foreground">{receipt.invoiceNumber}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <WhatsAppShareButton
              label="WhatsApp"
              invoiceNumber={receipt.invoiceNumber}
              customerName={receipt.customerName}
              customerPhone={receipt.customerPhone ?? null}
              receivedDate={receipt.receivedDate}
              items={receipt.items.map((it) => ({
                serviceName: it.serviceName,
                unit: it.unit,
                quantity: it.quantity,
                total: it.total,
              }))}
              total={receipt.total}
              paidAmount={receipt.paidAmount}
              paymentStatus={receipt.paymentStatus}
              workflowStatus={receipt.workflowStatus}
            />
            <CopyLinkButton />
            <PrintButton />
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Pelanggan</span>
            <span className="min-w-0 break-words text-right font-medium">{receipt.customerName}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">Tanggal masuk</span>
            <span className="font-medium">{formatDate(receipt.receivedDate)}</span>
          </div>
          {receipt.completedDate ? (
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Tanggal selesai</span>
              <span className="font-medium">{formatDate(receipt.completedDate)}</span>
            </div>
          ) : null}
          {receipt.pickupDate ? (
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Tanggal ambil</span>
              <span className="font-medium">{formatDate(receipt.pickupDate)}</span>
            </div>
          ) : null}
        </div>

        <div className="border-t pt-3 print:break-inside-avoid">
          <p className="mb-3 text-sm font-semibold">Rincian item</p>
          <ul className="space-y-0 divide-y divide-border rounded-lg border border-border text-sm">
            {receipt.items.map((it, idx) => {
              const qty = Number(it.quantity)
              const unitPrice = Number(it.unitPrice)
              const discount = Number(it.discount)
              const gross = lineGrossBeforeDiscount(qty, unitPrice)
              const pct = discountPercentOfGross(gross, discount)
              const lineTotal = Number(it.total)
              const qtyLabel = `${qty.toLocaleString("id-ID")} ${it.unit}`
              return (
                <li key={`${it.serviceName}-${idx}`} className="space-y-1.5 px-3 py-3">
                  <p className="font-medium leading-snug text-foreground">{it.serviceName}</p>
                  <div className="flex items-baseline justify-between gap-3 tabular-nums">
                    <span className="min-w-0 text-muted-foreground">
                      {qtyLabel} × {formatCurrency(unitPrice)}
                    </span>
                    <span className="shrink-0 text-right">{formatCurrency(gross)}</span>
                  </div>
                  {discount > 0 ? (
                    <div className="flex items-baseline justify-between gap-3 pl-2 text-xs tabular-nums text-destructive sm:pl-3">
                      <span>
                        Diskon
                        {pct != null ? ` (${formatPercentId(pct)}%)` : null}
                      </span>
                      <span className="shrink-0 text-right">−{formatCurrency(discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-end border-t border-dashed border-border pt-1.5 tabular-nums">
                    <span className="font-semibold text-foreground">{formatCurrency(lineTotal)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="border-t pt-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Dibayar</span>
            <span className="font-medium">{formatCurrency(paid)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Sisa</span>
            <span className="font-medium">{formatCurrency(remaining)}</span>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Status pembayaran</span>
              <span>{paymentLabel(receipt.paymentStatus)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Status workflow</span>
              <span>{workflowLabel(receipt.workflowStatus)}</span>
            </div>
          </div>
        </div>

        {imageUrls.length > 0 ? (
          <div className="border-t pt-3">
            <p className="mb-2 text-sm font-semibold">Gambar</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {imageUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                  <img src={url} alt="lampiran nota" className="max-h-80 w-full rounded-md border object-cover" />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {receipt.note ? (
          <div className="border-t pt-3">
            <p className="mb-1 text-sm font-semibold">Catatan</p>
            <p className="text-sm text-muted-foreground">{receipt.note}</p>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
