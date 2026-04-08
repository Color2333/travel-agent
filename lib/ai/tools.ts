import { tool } from 'ai';
import { z } from 'zod';
import type { WeatherData } from '@/types';
import { getNearbyCities } from '@/lib/cities/utils';
import { fetchWeather } from '@/lib/weather/api';
import { weatherCache } from '@/lib/weather/cache';

function parseDateQuery(query: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const absoluteDateMatch = query.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (absoluteDateMatch) {
    return absoluteDateMatch[1];
  }

  const offsetMap: Record<string, () => Date> = {
    '这周六': () => {
      const d = new Date(today);
      d.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
      return d;
    },
    '这周日': () => {
      const d = new Date(today);
      d.setDate(today.getDate() + ((7 - today.getDay() + 7) % 7 || 7));
      return d;
    },
    '下周六': () => {
      const d = new Date(today);
      d.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7) + 7);
      return d;
    },
    '下周日': () => {
      const d = new Date(today);
      d.setDate(today.getDate() + ((7 - today.getDay() + 7) % 7) + 7);
      return d;
    },
    '明天': () => {
      const d = new Date(today);
      d.setDate(today.getDate() + 1);
      return d;
    },
    '后天': () => {
      const d = new Date(today);
      d.setDate(today.getDate() + 2);
      return d;
    },
  };

  const resolver = offsetMap[query];
  if (resolver) {
    return resolver().toISOString().split('T')[0];
  }

  const fallback = new Date(today);
  fallback.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  return fallback.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${days[date.getDay()]}`;
}

export const tools = {
  get_location: tool({
    description: '获取用户当前城市位置',
    inputSchema: z.object({}),
    execute: async () => ({
      city: '上海',
      lat: 31.2304,
      lng: 121.4737,
    }),
  }),

  parse_date: tool({
    description: '解析用户输入的自然语言日期为具体日期',
    inputSchema: z.object({
      query: z.string().describe('自然语言日期，如"这周六"、"明天"、"2026-04-12"'),
    }),
    execute: async ({ query }: { query: string }) => {
      const dateStr = parseDateQuery(query);
      return {
        date: dateStr,
        display: formatDateDisplay(dateStr),
      };
    },
  }),

  get_nearby_cities: tool({
    description: '获取指定城市周边的可达城市列表',
    inputSchema: z.object({
      city: z.string().describe('出发城市名'),
      maxDistance: z.number().optional().describe('最大距离公里数，默认300'),
    }),
    execute: async ({ city, maxDistance }: { city: string; maxDistance?: number }) => {
      try {
        const cities = getNearbyCities(city, maxDistance ?? 300);
        return { cities, count: cities.length };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          cities: [],
        };
      }
    },
  }),

  get_weather: tool({
    description: '查询指定城市指定日期的详细天气预报',
    inputSchema: z.object({
      city: z.string().describe('城市名'),
      date: z.string().describe('日期 YYYY-MM-DD'),
    }),
    execute: async ({ city, date }: { city: string; date: string }) => {
      try {
        const cached = weatherCache.get(city, date);
        if (cached) return cached;

        const weather = await fetchWeather(city, date);
        weatherCache.set(city, date, weather);
        return weather;
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  }),

  get_batch_weather: tool({
    description: '批量查询多个城市的天气',
    inputSchema: z.object({
      cities: z.array(z.string()).describe('城市名列表'),
      date: z.string().describe('日期 YYYY-MM-DD'),
    }),
    execute: async ({ cities, date }: { cities: string[]; date: string }) => {
      const results = await Promise.all(
        cities.map(async (city: string) => {
          try {
            const cached = weatherCache.get(city, date);
            if (cached) return cached;

            const weather = await fetchWeather(city, date);
            weatherCache.set(city, date, weather);
            return weather;
          } catch {
            return null;
          }
        })
      );
      return results.filter((r): r is WeatherData => r !== null);
    },
  }),
};
