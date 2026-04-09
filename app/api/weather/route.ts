import { NextResponse } from 'next/server';
import type { WeatherData } from '@/types';
import { getCityByName } from '@/lib/cities/utils';
import { getErrorStatus } from '@/lib/errors';
import { weatherQuerySchema } from '@/lib/validation';
import { fetchWeather } from '@/lib/weather/api';
import { weatherCache } from '@/lib/weather/cache';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<NextResponse<WeatherData | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const parseResult = weatherQuerySchema.safeParse({
    city: searchParams.get('city'),
    date: searchParams.get('date'),
  });

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.issues[0]?.message ?? 'Invalid query parameters' }, { status: 400 });
  }

  const { city: cityParam, date: dateParam } = parseResult.data;
  const cacheKey = getCityByName(cityParam)?.qweatherId;

  const cached = weatherCache.get(cityParam, dateParam, cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const weather = await fetchWeather(cityParam, dateParam);
    weatherCache.set(cityParam, dateParam, weather, cacheKey);
    return NextResponse.json(weather);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather';
    return NextResponse.json({ error: errorMessage }, { status: getErrorStatus(error) });
  }
}
