export function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

const APP_TIME_ZONE = 'Asia/Makassar';
const WITA_OFFSET = '+08:00';

function toDateAssumeWita(value: Date | string): Date {
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  if (!raw) return new Date(NaN);

  const hasTimeZone = /[zZ]$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(raw);
  if (!hasTimeZone) {
    const dtMatch = raw.match(
      /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?(?:\.(\d{1,9}))?$/,
    );
    if (dtMatch) {
      const ymd = dtMatch[1];
      const hm = dtMatch[2];
      const ss = dtMatch[3] ?? '00';
      const fracRaw = dtMatch[4];
      const ms = fracRaw ? fracRaw.slice(0, 3).padEnd(3, '0') : null;
      return new Date(`${ymd}T${hm}:${ss}${ms ? `.${ms}` : ''}${WITA_OFFSET}`);
    }

    const dateOnlyMatch = raw.match(/^\d{4}-\d{2}-\d{2}$/);
    if (dateOnlyMatch) {
      return new Date(`${raw}T00:00:00${WITA_OFFSET}`);
    }
  }

  return new Date(raw);
}

/** Tanggal & jam dalam zona Asia/Makassar (WITA), untuk nota/pembayaran konsisten di seluruh app. */
export function formatDate(value: Date | string) {
  const date = toDateAssumeWita(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

/** Format struk WA: `18 Mei 2026, 18.00` (WITA). */
export function formatReceiptDateTime(value: Date | string) {
  const date = toDateAssumeWita(value);
  if (Number.isNaN(date.getTime())) return '-';
  const datePart = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
  }).format(date);
  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: APP_TIME_ZONE,
  }).format(date);
  const time = timePart.replace(':', '.');
  return `${datePart}, ${time}`;
}
