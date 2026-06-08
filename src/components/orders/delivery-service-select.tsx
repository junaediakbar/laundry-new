"use client"

import { useCreateOrderPricing } from "@/components/orders/create-order-form"
import {
  DELIVERY_SERVICE_CATEGORIES,
  formatDeliveryEstimate,
  formatExpediteServiceDisplay,
  formatSurchargePercent,
  type DeliveryServiceCategory,
} from "@/lib/delivery-service"

type DeliveryServiceSelectProps = {
  defaultValue?: DeliveryServiceCategory
}

export function DeliveryServiceSelect({
  defaultValue = "reguler",
}: DeliveryServiceSelectProps) {
  const pricing = useCreateOrderPricing()
  const selected = pricing?.deliveryCategory ?? defaultValue
  const setSelected =
    pricing?.setDeliveryCategory ??
    (() => {
      /* noop outside CreateOrderForm */
    })
  const selectedOption = DELIVERY_SERVICE_CATEGORIES.find(
    (opt) => opt.value === selected,
  )

  return (
    <div className="space-y-3">
      <input type="hidden" name="deliveryServiceCategory" value={selected} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Kategori percepatan</legend>
        <p className="text-xs text-muted-foreground">
          Pilih kecepatan penyelesaian cucian. Bukan layanan antar-jemput.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DELIVERY_SERVICE_CATEGORIES.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="deliveryServiceCategoryUi"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDeliveryEstimate(opt.estimateDays)}
                  {opt.surchargePercent > 0
                    ? ` · ${formatSurchargePercent(opt.surchargePercent)}`
                    : " · harga dasar"}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {selectedOption ? (
        <p className="text-xs text-muted-foreground">
          Dipilih:{" "}
          <span className="font-medium text-foreground">
            {formatExpediteServiceDisplay(selectedOption.value, selectedOption.estimateDays)}
          </span>
          {selectedOption.surchargePercent > 0
            ? ` · markup ${formatSurchargePercent(selectedOption.surchargePercent)}`
            : null}
        </p>
      ) : null}
    </div>
  )
}
