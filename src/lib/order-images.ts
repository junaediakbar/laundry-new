/** Resolve stored order image path(s) to absolute URLs for <img src>. */
export function resolveOrderImageUrls(
  backendBase: string,
  image?: string | null,
  images?: string[] | null,
): string[] {
  const raw =
    images && images.length > 0 ? images : image && image.length > 0 ? [image] : []
  const base = backendBase.replace(/\/$/, "")
  return raw
    .map((u) => {
      const s = u.trim()
      if (!s) return ""
      if (s.startsWith("http://") || s.startsWith("https://")) return s
      return `${base}${s.startsWith("/") ? "" : "/"}${s}`
    })
    .filter(Boolean)
}
