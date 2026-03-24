export type LatLng = { lat: number; lng: number }

export function haversineDistanceKm(a: LatLng, b: LatLng) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
  return R * c
}

export function nearestNeighborOrder<T extends { location: LatLng }>(start: LatLng, points: T[]) {
  const remaining = [...points]
  const ordered: T[] = []
  let current = start

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistanceKm(current, remaining[i].location)
      if (d < bestDistance) {
        bestDistance = d
        bestIndex = i
      }
    }

    const next = remaining.splice(bestIndex, 1)[0]
    ordered.push(next)
    current = next.location
  }

  return ordered
}

export function nearestNeighborOrderWithEnd<T extends { location: LatLng }>(
  start: LatLng,
  end: LatLng,
  points: T[],
) {
  const remaining = [...points]
  const ordered: T[] = []
  let current = start

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestScore = Number.POSITIVE_INFINITY

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i]
      const score =
        haversineDistanceKm(current, candidate.location) +
        haversineDistanceKm(candidate.location, end)
      if (score < bestScore) {
        bestScore = score
        bestIndex = i
      }
    }

    const next = remaining.splice(bestIndex, 1)[0]
    ordered.push(next)
    current = next.location
  }

  return ordered
}

export function buildGoogleMapsDirectionsUrl(start: LatLng, stops: LatLng[], end?: LatLng) {
  if (stops.length === 0) return null
  const origin = `${start.lat},${start.lng}`
  const destinationPoint = end ?? stops[stops.length - 1]
  const destination = `${destinationPoint.lat},${destinationPoint.lng}`
  const waypoints = (end ? stops : stops.slice(0, -1)).map((s) => `${s.lat},${s.lng}`)
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  })
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.join("|"))
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
