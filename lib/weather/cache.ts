import type { WeatherData } from '../../types/index.ts';

const CACHE_DURATION = 60 * 60 * 1000;

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

export class WeatherCache {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map();
  }

  private makeKey(city: string, date: string, cacheKey?: string): string {
    return `${cacheKey ?? city}_${date}`;
  }

  get(city: string, date: string, cacheKey?: string): WeatherData | null {
    const key = this.makeKey(city, date, cacheKey);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(city: string, date: string, data: WeatherData, cacheKey?: string): void {
    const key = this.makeKey(city, date, cacheKey);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const weatherCache = new WeatherCache();
