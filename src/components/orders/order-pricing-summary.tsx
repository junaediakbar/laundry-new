"use client"

import { useCreateOrderPricing } from "@/components/orders/create-order-form"
import {
  applyDeliverySurcharge,
  formatExpediteServiceDisplay,
  formatSurchargePercent,
} from "@/lib/delivery-service"

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

export function OrderPricingSummary() {
  const pricing = useCreateOrderPricing()
  const itemsSubtotal = pricing?.itemsSubtotal ?? 0
  const breakdown = applyDeliverySurcharge(
    itemsSubtotal,
    pricing?.deliveryCategory ?? "reguler",
  )

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Subtotal item</span>
        <span className="font-medium tabular-nums">Rp {formatIdr(itemsSubtotal)}</span>
      </div>
      {breakdown.surchargePercent > 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Tambahan {formatExpediteServiceDisplay(pricing?.deliveryCategory ?? "reguler")}{" "}
            ({formatSurchargePercent(breakdown.surchargePercent)})
          </span>
          <span className="font-medium tabular-nums">
            Rp {formatIdr(breakdown.surchargeAmount)}
          </span>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
        <p className="text-sm font-semibold">Total Nota</p>
        <p className="text-sm font-semibold tabular-nums">
          Rp {formatIdr(breakdown.grandTotal)}
        </p>
      </div>
    </div>
  )
}
