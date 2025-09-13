export function getDistance(
  loc: { lat: number; lng: number },
  zone: { lat: number; lng: number }
): number {
  const R = 6371e3; // meters
  const φ1 = (loc.lat * Math.PI) / 180;
  const φ2 = (zone.lat * Math.PI) / 180;
  const Δφ = ((zone.lat - loc.lat) * Math.PI) / 180;
  const Δλ = ((zone.lng - loc.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestZone(
  loc: { lat: number; lng: number },
  zones: Array<{ lat: number; lng: number; radius: number; name: string }>
): { lat: number; lng: number; radius: number; name: string; distance: number } | null {
  if (!loc) return null;

  let nearest: { lat: number; lng: number; radius: number; name: string; distance: number } | null = null;
  let minDist = Infinity;

  for (const z of zones) {
    const dist = getDistance(loc, z);
    if (dist < minDist) {
      minDist = dist;
      nearest = { ...z, distance: dist };
      if (dist === 0) break; // exact match, no need to continue
    }
  }

  return nearest;
} 
