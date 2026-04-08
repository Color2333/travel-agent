import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { WeatherData } from '@/types';
import { fetchWeather } from '@/lib/weather/api';
import { weatherCache } from '@/lib/weather/cache';

export const runtime = 'nodejs';

const querySchema = z.object({
  city: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request): Promise<NextResponse<WeatherData | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const date = searchParams.get('date');

  const parseResult = querySchema.safeParse({ city, date });

  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid or missing parameters: city and date (YYYY-MM-DD) are required' }, { status: 400 });
  }

  const { city: cityParam, date: dateParam } = parseResult.data;

  const cached = weatherCache.get(cityParam, dateParam);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const weather = await fetchWeather(cityParam, dateParam);
    weatherCache.set(cityParam, dateParam, weather);
    return NextResponse.json(weather);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
