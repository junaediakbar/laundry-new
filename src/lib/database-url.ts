export function normalizeDatabaseUrl(rawUrl: string) {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return rawUrl
  }

  const hostname = url.hostname.toLowerCase()
  const isPooler = hostname.includes("pooler") || url.port === "6543"
  if (!isPooler) {
    return rawUrl
  }

  if (!url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true")
  }
  if (!url.searchParams.has("statement_cache_size")) {
    url.searchParams.set("statement_cache_size", "0")
  }

  return url.toString()
}
