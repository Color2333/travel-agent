import { NextResponse } from 'next/server';
import { getNearbyCities } from '@/lib/cities/utils';
import type { City } from '@/types';
import { ResourceNotFoundError, getErrorStatus } from '@/lib/errors';
import { citiesQuerySchema } from '@/lib/validation';

export const runtime = 'nodejs';

interface CitiesResponse {
  origin: string;
  cities: City[];
  count: number;
}

export async function GET(request: Request): Promise<NextResponse<CitiesResponse | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const parseResult = citiesQuerySchema.safeParse({
    city: searchParams.get('city') ?? '上海',
    maxDistance: searchParams.get('maxDistance') ?? 300,
  });

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.issues[0]?.message ?? 'Invalid query parameters' }, { status: 400 });
  }

  const { city, maxDistance } = parseResult.data;

  try {
    const cities = getNearbyCities(city, maxDistance);
    if (cities.length === 0) {
      throw new ResourceNotFoundError(`No supported nearby cities found for origin: ${city}`);
    }

    const response: CitiesResponse = {
      origin: city,
      cities,
      count: cities.length,
    };
    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch nearby cities';
    return NextResponse.json({ error: errorMessage }, { status: getErrorStatus(error) });
  }
}
