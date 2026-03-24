/**
 * Parse latitude/longitude from a Google Maps URL, preferring the place (POI) pin
 * embedded in protobuf-style segments (!3d / !4d) over map camera (@…) or ?q=.
 */
export function parseGoogleMapsPoiLatLng(
  input: string | null | undefined,
): { latitude: number | null; longitude: number | null } {
  const raw = (input ?? '').trim();
  if (!raw) {
    return { latitude: null, longitude: null };
  }

  const cleaned = raw.replace(/\s/g, '');
  const decoded = (() => {
    try {
      return decodeURIComponent(cleaned);
    } catch {
      return cleaned;
    }
  })();

  // Listing slug: POI coordinates usually appear immediately before !16s
  const before16s = decoded.match(
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)!16s/i,
  );
  if (before16s) {
    const latitude = Number(before16s[1]);
    const longitude = Number(before16s[2]);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }

  const pairRe = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/gi;
  let last: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = pairRe.exec(decoded)) !== null) {
    last = m;
  }
  if (last) {
    const latitude = Number(last[1]);
    const longitude = Number(last[2]);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }

  const llMatch = decoded.match(/[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (llMatch) {
    return { latitude: Number(llMatch[1]), longitude: Number(llMatch[2]) };
  }

  const qMatch = decoded.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (qMatch) {
    return { latitude: Number(qMatch[1]), longitude: Number(qMatch[2]) };
  }

  const queryMatch = decoded.match(
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,
  );
  if (queryMatch) {
    return {
      latitude: Number(queryMatch[1]),
      longitude: Number(queryMatch[2]),
    };
  }

  const atMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };
  }

  const plainMatch = decoded.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (plainMatch) {
    return {
      latitude: Number(plainMatch[1]),
      longitude: Number(plainMatch[2]),
    };
  }

  return { latitude: null, longitude: null };
}
