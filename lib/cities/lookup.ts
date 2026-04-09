import { getCityByName } from './utils.ts';
import { UpstreamServiceError } from '../errors.ts';

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
