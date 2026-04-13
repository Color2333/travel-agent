import type { WeatherData } from '../../types/index.ts';

const CACHE_DURATION = 60 * 60 * 1000; // 1 小时
const MAX_CACHE_SIZE = 500; // 最大缓存条目数

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
    
    // LRU: 如果缓存已满，删除最旧的条目
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const weatherCache = new WeatherCache();
