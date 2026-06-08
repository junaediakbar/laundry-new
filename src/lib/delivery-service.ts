export const DELIVERY_SERVICE_CATEGORIES = [
  { value: 'express_1', label: 'Express 1', estimateDays: 1, surchargePercent: 100 },
  { value: 'express_2', label: 'Express 2', estimateDays: 2, surchargePercent: 50 },
  { value: 'express_3', label: 'Express 3', estimateDays: 3, surchargePercent: 25 },
  { value: 'cepat', label: 'Cepat', estimateDays: 5, surchargePercent: 10 },
  { value: 'reguler', label: 'Reguler', estimateDays: 7, surchargePercent: 0 },
] as const;

export type DeliveryServiceCategory =
  (typeof DELIVERY_SERVICE_CATEGORIES)[number]['value'];

const categoryByValue = new Map(
  DELIVERY_SERVICE_CATEGORIES.map((c) => [c.value, c]),
);

/** Nilai tampilan untuk nota lama yang belum punya kategori tersimpan. */
export const LEGACY_DELIVERY_FALLBACK = {
  category: 'reguler' as DeliveryServiceCategory,
  label: 'Reguler',
  estimateDays: 7,
  surchargePercent: 0,
};

export function deliveryServiceLabel(
  category: string | null | undefined,
): string {
  if (!category) return LEGACY_DELIVERY_FALLBACK.label;
  return categoryByValue.get(category as DeliveryServiceCategory)?.label ?? category;
}

export function deliverySurchargePercentFor(
  category: string | null | undefined,
): number {
  if (!category) return LEGACY_DELIVERY_FALLBACK.surchargePercent;
  return (
    categoryByValue.get(category as DeliveryServiceCategory)?.surchargePercent ?? 0
  );
}

export function deliveryEstimateDaysFor(
  category: string | null | undefined,
): number | null {
  if (!category) return LEGACY_DELIVERY_FALLBACK.estimateDays;
  return (
    categoryByValue.get(category as DeliveryServiceCategory)?.estimateDays ?? null
  );
}

export function formatDeliveryEstimate(
  days: number | null | undefined,
  category?: string | null,
): string {
  const resolved =
    days != null && days > 0
      ? days
      : deliveryEstimateDaysFor(category ?? null);
  if (resolved == null || resolved <= 0) return '-';
  return `${resolved} hari kerja`;
}

/** Nama kategori + estimasi hari, mis. "Express 1 · 1 hari kerja". */
export function formatExpediteServiceDisplay(
  category: string | null | undefined,
  estimateDays?: number | null,
): string {
  const label = deliveryServiceLabel(category);
  const estimate = formatDeliveryEstimate(
    estimateDays ?? deliveryEstimateDaysFor(category),
    category,
  );
  if (estimate === '-') return label;
  return `${label} · ${estimate}`;
}

export function formatSurchargePercent(percent: number): string {
  if (percent <= 0) return 'Tanpa tambahan';
  return `+${percent}%`;
}

/** Subtotal item + markup layanan percepatan. */
export function applyDeliverySurcharge(
  itemsSubtotal: number,
  category: string | null | undefined,
): { surchargePercent: number; surchargeAmount: number; grandTotal: number } {
  const surchargePercent = deliverySurchargePercentFor(category);
  const surchargeAmount =
    surchargePercent > 0
      ? Math.round((itemsSubtotal * surchargePercent) / 100)
      : 0;
  return {
    surchargePercent,
    surchargeAmount,
    grandTotal: itemsSubtotal + surchargeAmount,
  };
}

export function formatDeliveryServiceSummary(
  category: string | null | undefined,
  estimateDays: number | null | undefined,
): string {
  const parts = [formatExpediteServiceDisplay(category, estimateDays)];
  const surcharge = deliverySurchargePercentFor(category);
  if (surcharge > 0) parts.push(formatSurchargePercent(surcharge));
  return parts.join(' · ');
}
