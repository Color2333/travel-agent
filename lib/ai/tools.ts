import { tool } from 'ai';
import { addDays, format, startOfDay } from 'date-fns';
import { z } from 'zod';
import { formatDateDisplay, parseDateQuery } from '@/lib/ai/date';
import { planTrip } from '@/lib/ai/plan-trip';
import { cityNameSchema, forecastDateSchema, positiveIntegerDistanceSchema } from '@/lib/validation';

export const tools = {
  get_location: tool({
    description: '获取用户当前城市位置',
    inputSchema: z.object({}),
    execute: async () => ({ city: '上海', lat: 31.2304, lng: 121.4737 }),
  }),

  parse_date: tool({
    description: '解析用户输入的自然语言日期为具体日期',
    inputSchema: z.object({
      query: z.string().trim().min(1).describe('自然语言日期，如"这周六"、"明天"、"2026-04-12"'),
    }),
    execute: async ({ query }: { query: string }) => {
      const dateStr = parseDateQuery(query);
      return { date: dateStr, display: formatDateDisplay(dateStr) };
    },
  }),

  plan_trip: tool({
    description: '一站式出行规划：根据出发城市和日期，自动查找周边城市并批量查询天气，返回完整的推荐结果',
    inputSchema: z.object({
      city: cityNameSchema.describe('出发城市名'),
      date: forecastDateSchema.describe(`出行日期 YYYY-MM-DD，必须在未来7天内，例如 ${format(addDays(startOfDay(new Date()), 1), 'yyyy-MM-dd')}`),
      maxDistance: positiveIntegerDistanceSchema.optional().describe('最大距离公里数，默认300'),
    }),
    execute: async ({ city, date, maxDistance }: { city: string; date: string; maxDistance?: number }) =>
      planTrip(city, date, maxDistance ?? 300),
  }),
};
