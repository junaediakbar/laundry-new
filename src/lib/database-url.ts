export function normalizeDatabaseUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const hostname = url.hostname.toLowerCase();
  const isLikelyPooler =
    hostname.includes('pooler') ||
    url.port === '6543' ||
    url.searchParams.get('pgbouncer') === 'true';
  if (!isLikelyPooler) {
    return rawUrl;
  }

  if (!url.searchParams.has('pgbouncer')) {
    url.searchParams.set('pgbouncer', 'true');
  }
  if (!url.searchParams.has('statement_cache_size')) {
    url.searchParams.set('statement_cache_size', '0');
  }
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '1');
  }

  return url.toString();
}
