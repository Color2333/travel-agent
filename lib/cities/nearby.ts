import type { City } from '../../types/index.ts';
import { searchQWeatherNearbyCities } from './lookup.ts';
import { findNearbyFromCoords } from './utils.ts';

/**
 * Finds nearby cities using QWeather's full city database first.
 * Falls back to the local static city DB, and merges the two when QWeather is sparse.
 */
export async function resolveNearbyCities(
  originLat: number,
  originLng: number,
  maxDistance: number,
  excludeName: string,
): Promise<City[]> {
  try {
    const qwCities = await searchQWeatherNearbyCities(originLat, originLng, maxDistance, excludeName);
    if (qwCities.length >= 3) return qwCities;

    const staticCities = findNearbyFromCoords(originLat, originLng, maxDistance, excludeName);
    if (qwCities.length === 0) return staticCities;

    const qwNames = new Set(qwCities.map((c) => c.name));
    const supplement = staticCities.filter((c) => !qwNames.has(c.name));
    return [...qwCities, ...supplement].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  } catch {
    return findNearbyFromCoords(originLat, originLng, maxDistance, excludeName);
  }
}
