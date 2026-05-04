/** Nilai form field `pickupDelivery` (string kosong = belum tahu). */
export const PICKUP_DELIVERY_FORM_OPTIONS = [
  { value: '', label: '-' },
  { value: 'false', label: 'Tidak' },
  { value: 'true', label: 'Ya' },
] as const;

/** Untuk tabel / ringkasan dari API (`null` = belum tahu). */
export function pickupDeliveryLabel(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value ? 'Ya' : 'Tidak';
}

/** Nilai awal field select pickupDelivery (buat / ubah nota). */
export function pickupDeliveryToFormValue(
  value: boolean | null | undefined,
): '' | 'true' | 'false' {
  if (value === null || value === undefined) return '';
  return value ? 'true' : 'false';
}
