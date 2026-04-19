/** Satuan luas meter persegi: `m2`, `m²`, variasi spasi. */
export function isM2AreaUnit(unit: string | undefined | null): boolean {
  if (unit == null || !String(unit).trim()) return false
  const u = String(unit)
    .trim()
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/²/g, '2')
    .replace(/\^2/g, '2')
  return u === 'm2'
}

/** Parse angka meter (panjang/lebar) dari string/number. */
export function parseDimMeter(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null
  const n =
    typeof v === 'number' ? v : Number(String(v).trim().replace(/\s/g, '').replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function formatDimM(n: number): string {
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * Tampilan qty / ukuran satu baris:
 * - m² + panjang+lebar tersimpan → `P m × L m = luas m²`
 * - lainnya → `qty unit`
 */
export function formatOrderItemQtyDescription(input: {
  unit: string
  quantity: string | number
  lengthM?: string | number | null
  widthM?: string | number | null
}): string {
  const unit = (input.unit || '').trim()
  const lm = parseDimMeter(input.lengthM)
  const wm = parseDimMeter(input.widthM)
  if (isM2AreaUnit(unit) && lm != null && wm != null) {
    const area = lm * wm
    return `${formatDimM(lm)} m × ${formatDimM(wm)} m = ${formatDimM(area)} m²`
  }
  const qtyRaw =
    typeof input.quantity === 'string'
      ? Number(String(input.quantity).trim().replace(/\s/g, '').replace(',', '.'))
      : input.quantity
  const q = Number.isFinite(qtyRaw) ? qtyRaw : 0
  const qStr = q.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return unit ? `${qStr} ${unit}` : qStr
}

/** Sama dengan `formatOrderItemQtyDescription` (pesan WA / struk). */
export function formatOrderItemQtyForShare(input: {
  unit: string
  quantity: string | number
  lengthM?: string | number | null
  widthM?: string | number | null
}): string {
  return formatOrderItemQtyDescription(input)
}
