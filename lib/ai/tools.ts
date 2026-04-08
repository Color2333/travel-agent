import { tool } from 'ai';
import { z } from 'zod';
import { getNearbyCities } from '@/lib/cities/utils';
import { fetchWeatherById, fetchWeather } from '@/lib/weather/api';
import { weatherCache } from '@/lib/weather/cache';
import type { WeatherData } from '@/types';

function parseDateQuery(query: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const m = query.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (m) return m[1];

  const map: Record<string, () => Date> = {
    '这周六': () => { const d = new Date(today); d.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7)); return d; },
    '这周日': () => { const d = new Date(today); d.setDate(today.getDate() + ((7 - today.getDay() + 7) % 7 || 7)); return d; },
    '下周六': () => { const d = new Date(today); d.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7) + 7); return d; },
    '下周日': () => { const d = new Date(today); d.setDate(today.getDate() + ((7 - today.getDay() + 7) % 7) + 7); return d; },
    '明天': () => { const d = new Date(today); d.setDate(today.getDate() + 1); return d; },
    '后天': () => { const d = new Date(today); d.setDate(today.getDate() + 2); return d; },
  };

  const resolver = map[query];
  if (resolver) return resolver().toISOString().split('T')[0];

  const fallback = new Date(today);
  fallback.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  return fallback.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`;
}

export const tools = {
  get_location: tool({
    description: '获取用户当前城市位置',
    inputSchema: z.object({}),
    execute: async () => ({ city: '上海', lat: 31.2304, lng: 121.4737 }),
  }),

  parse_date: tool({
    description: '解析用户输入的自然语言日期为具体日期',
    inputSchema: z.object({
      query: z.string().describe('自然语言日期，如"这周六"、"明天"、"2026-04-12"'),
    }),
    execute: async ({ query }: { query: string }) => {
      const dateStr = parseDateQuery(query);
      return { date: dateStr, display: formatDateDisplay(dateStr) };
    },
  }),

  plan_trip: tool({
    description: '一站式出行规划：根据出发城市和日期，自动查找周边城市并批量查询天气，返回完整的推荐结果',
    inputSchema: z.object({
      city: z.string().describe('出发城市名'),
      date: z.string().describe('出行日期 YYYY-MM-DD'),
      maxDistance: z.number().optional().describe('最大距离公里数，默认300'),
    }),
    execute: async ({ city, date, maxDistance }: { city: string; date: string; maxDistance?: number }) => {
      try {
        const nearbyCities = getNearbyCities(city, maxDistance ?? 300);
        if (nearbyCities.length === 0) {
          return { error: `未找到 ${city} 附近的城市的`, cities: [] };
        }

        const results = await Promise.all(
          nearbyCities.map(async (c) => {
            try {
              const cached = weatherCache.get(c.name, date);
              if (cached) return { ...cached, distance: c.distance, trainTime: c.trainTime, driveTime: c.driveTime };

              let weather: WeatherData;
              if (c.qweatherId) {
                weather = await fetchWeatherById(c.qweatherId, c.name, date);
              } else {
                weather = await fetchWeather(c.name, date);
              }
              weatherCache.set(c.name, date, weather);
              return { ...weather, distance: c.distance, trainTime: c.trainTime, driveTime: c.driveTime };
            } catch {
              return null;
            }
          })
        );

        const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);
        validResults.sort((a, b) => b.score - a.score);

        const sunny = validResults.filter(r => r.weather === 'sunny').length;
        const cloudy = validResults.filter(r => r.weather === 'cloudy').length;
        const rainy = validResults.filter(r => r.weather === 'rainy').length;
        const other = validResults.length - sunny - cloudy - rainy;

        const summary = `${validResults.length}个城市中，${sunny ? sunny + '个晴天' : ''}${cloudy ? (sunny ? '、' : '') + cloudy + '个多云' : ''}${rainy ? (sunny || cloudy ? '、' : '') + rainy + '个雨天' : ''}${other ? (sunny || cloudy || rainy ? '、' : '') + other + '个其他' : ''}`;

        const goodOptions = validResults.filter(r => r.score >= 70).map(r => ({
          city: r.city,
          score: r.score,
          weather: r.weatherText,
          tempHigh: r.tempHigh,
          tempLow: r.tempLow,
          rainProbability: r.rainProbability,
          trainTime: r.trainTime,
          reason: r.score >= 85 ? '天气优秀，强烈推荐' : '天气不错，适合出行',
        }));

        const avoidCities = validResults.filter(r => r.score < 30).map(r => ({
          city: r.city,
          score: r.score,
          weather: r.weatherText,
          reason: r.weatherText?.includes('雨') ? '有降雨，不建议出行' : '天气较差',
        }));

        const topRecommendation = validResults.length > 0 ? {
          city: validResults[0].city,
          score: validResults[0].score,
          weather: validResults[0].weatherText,
          tempHigh: validResults[0].tempHigh,
          tempLow: validResults[0].tempLow,
          trainTime: validResults[0].trainTime,
          reason: `天气评分最高(${validResults[0].score}分)`,
        } : null;

        return {
          origin: city,
          date,
          cities: validResults,
          summary,
          topRecommendation,
          goodOptions,
          avoidCities,
        };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error', cities: [] };
      }
    },
  }),
};
