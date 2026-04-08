import { CITY_DATABASE } from './data';
import type { City } from '@/types';

export function getNearbyCities(cityName: string, maxDistance: number = 300): City[] {
  const city = CITY_DATABASE[cityName];
  if (!city) {
    return [];
  }
  return city.nearby.filter((c) => (c.distance ?? 0) <= maxDistance);
}

export function getCityByName(name: string): City | undefined {
  if (CITY_DATABASE[name]) {
    const entry = CITY_DATABASE[name];
    return { name: entry.name, lat: entry.lat, lng: entry.lng };
  }

  for (const mainCity of Object.values(CITY_DATABASE)) {
    const found = mainCity.nearby.find((c) => c.name === name);
    if (found) return found;
  }

  return undefined;
}

export function getAllMainCities(): string[] {
  return Object.keys(CITY_DATABASE);
}
