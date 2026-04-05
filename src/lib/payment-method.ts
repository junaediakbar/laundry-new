/** Nilai disimpan di API / DB (huruf kecil). */
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'qris', label: 'QRIS' },
  { value: 'lainnya', label: 'Lainnya' },
] as const

export function paymentMethodLabel(method: string): string {
  const row = PAYMENT_METHOD_OPTIONS.find((o) => o.value === method)
  return row?.label ?? method
}
