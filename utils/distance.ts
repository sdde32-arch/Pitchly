/**
 * Utility functions for geolocation and distance calculations.
 */

// Default center fallback (Kampala City Center / Kololo / Lugogo area)
export const DEFAULT_KAMPALA_COORDS: [number, number] = [0.3420, 32.5910];

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number" ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 9999;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Safely extracts latitude and longitude from a pitch object.
 */
export function getPitchCoordinates(pitch: any): [number, number] {
  if (typeof pitch?.latitude === "number" && typeof pitch?.longitude === "number") {
    return [pitch.latitude, pitch.longitude];
  }
  if (Array.isArray(pitch?.coordinates) && pitch.coordinates.length >= 2) {
    const lat = Number(pitch.coordinates[0]);
    const lon = Number(pitch.coordinates[1]);
    if (!isNaN(lat) && !isNaN(lon)) {
      return [lat, lon];
    }
  }
  // Deterministic fallback based on id hash for test pitches without coords
  const idStr = String(pitch?.id || pitch?.name || "pitch");
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 100) / 100) * 0.08 - 0.04;
  const lonOffset = (((Math.abs(hash) >> 4) % 100) / 100) * 0.08 - 0.04;
  return [DEFAULT_KAMPALA_COORDS[0] + latOffset, DEFAULT_KAMPALA_COORDS[1] + lonOffset];
}

/**
 * Formats a distance in kilometers nicely for display (e.g. "0.8 km" or "12.4 km").
 */
export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return "< 100 m";
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
