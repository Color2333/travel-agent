import { getCityByName, haversineDistance, estimateTransitTimes } from './utils.ts';
import { UpstreamServiceError } from '../errors.ts';
import type { City } from '../../types/index.ts';

export interface ResolvedCity {
  name: string;
  lat: number;
  lng: number;
}

// In-process cache: city name → resolved coords (lives for the server lifetime)
const coordCache = new Map<string, ResolvedCity>();

function getQWeatherConfig() {
  const key = process.env.WEATHER_API_KEY;
  if (!key) throw new Error('WEATHER_API_KEY environment variable is not set');
  const rawHost = process.env.WEATHER_API_HOST || 'ma5pwe7m85.re.qweatherapi.com';
  const origin = rawHost.startsWith('http') ? rawHost : `https://${rawHost}`;
  return { key, geoBase: `${origin}/geo/v2` };
}

/**
 * Resolves a Chinese city name to lat/lng.
 * 1. Checks local CITIES DB (fast, no API call)
 * 2. Falls back to QWeather Geo API (supports any city QWeather knows about)
 *
 * Returns null if the city cannot be found anywhere.
 */
export async function resolveOriginCity(name: string): Promise<ResolvedCity | null> {
  const cached = coordCache.get(name);
  if (cached) return cached;

  // 1. Local DB
  const local = getCityByName(name);
  if (local) {
    const resolved: ResolvedCity = { name: local.name, lat: local.lat, lng: local.lng };
    coordCache.set(name, resolved);
    return resolved;
  }

  // 2. QWeather Geo API
  try {
    const { key, geoBase } = getQWeatherConfig();
    const res = await fetch(
      `${geoBase}/city/lookup?location=${encodeURIComponent(name)}&key=${key}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code && data.code !== '200') return null;
    if (!data.location?.length) return null;

    const first = data.location[0];
    const resolved: ResolvedCity = {
      name: first.name as string,
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
    };
    coordCache.set(name, resolved);
    return resolved;
  } catch {
    throw new UpstreamServiceError(`城市坐标查询失败：${name}`);
  }
}

interface QWeatherCityResult {
  name: string;
  id: string;
  lat: string;
  lon: string;
  adm1: string; // province
  adm2: string; // prefecture
  type: string;
}

/**
 * Searches QWeather's full city database for cities near the given coordinates.
 * QWeather knows hundreds of thousands of Chinese cities and counties.
 *
 * QWeather format: location="{lng},{lat}" (longitude first)
 * Returns up to `count` nearest cities, filtered to those within maxDistance km.
 * Excludes origin city by name.
 */
export async function searchQWeatherNearbyCities(
  originLat: number,
  originLng: number,
  maxDistance: number,
  excludeName?: string,
  count: number = 20,
): Promise<City[]> {
  const { key, geoBase } = getQWeatherConfig();

  // QWeather expects lng,lat order
  const location = `${originLng.toFixed(4)},${originLat.toFixed(4)}`;
  const res = await fetch(
    `${geoBase}/city/lookup?location=${location}&range=cn&number=${count}&key=${key}`,
    { signal: AbortSignal.timeout(10_000) },
  );

  if (!res.ok) throw new UpstreamServiceError('QWeather city search failed');
  const data = await res.json();

  if (data.code && data.code !== '200') return [];
  if (!Array.isArray(data.location)) return [];

  const seen = new Set<string>();
  const cities: City[] = [];

  for (const loc of data.location as QWeatherCityResult[]) {
    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.lon);
    const dist = Math.round(haversineDistance(originLat, originLng, lat, lng));

    // Skip origin city, cities beyond range, and duplicates by QWeather ID
    if (excludeName && loc.name === excludeName) continue;
    if (dist > maxDistance || dist < 10) continue; // min 10km to exclude same-city districts
    if (seen.has(loc.id)) continue;
    seen.add(loc.id);

    const { trainTime, driveTime, trainPrice, drivePrice } = estimateTransitTimes(dist);
    cities.push({
      name: loc.name,
      lat,
      lng,
      qweatherId: loc.id,
      distance: dist,
      province: loc.adm1,
      trainTime,
      driveTime,
      trainPrice,
      drivePrice,
    });
  }

  // Sort by distance
  cities.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  return cities;
}
