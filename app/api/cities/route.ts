import { NextResponse } from 'next/server';
import { getNearbyCities } from '@/lib/cities/utils';
import type { City } from '@/types';

export const runtime = 'nodejs';

interface CitiesResponse {
  origin: string;
  cities: City[];
  count: number;
}

export async function GET(request: Request): Promise<NextResponse<CitiesResponse | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || '上海';
  const maxDistanceParam = searchParams.get('maxDistance');
  const maxDistance = maxDistanceParam ? parseInt(maxDistanceParam, 10) : 300;

  try {
    const cities = getNearbyCities(city, maxDistance);
    const response: CitiesResponse = {
      origin: city,
      cities,
      count: cities.length,
    };
    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch nearby cities';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
