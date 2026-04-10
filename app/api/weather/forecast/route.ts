import { NextResponse } from 'next/server';
import type { WeatherData } from '@/types';
import { getErrorStatus } from '@/lib/errors';
import { fetchWeatherForecast } from '@/lib/weather/api';

export const runtime = 'nodejs';

// Simple in-process cache: cityId → { data, ts }
const cache = new Map<string, { data: WeatherData[]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request): Promise<NextResponse<WeatherData[] | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get('cityId')?.trim();
  const cityName = searchParams.get('cityName')?.trim() ?? '';

  if (!cityId) {
    return NextResponse.json({ error: 'cityId is required' }, { status: 400 });
  }

  const cached = cache.get(cityId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const forecast = await fetchWeatherForecast(cityId, cityName);
    cache.set(cityId, { data: forecast, ts: Date.now() });
    return NextResponse.json(forecast);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch forecast';
    return NextResponse.json({ error: msg }, { status: getErrorStatus(error) });
  }
}
