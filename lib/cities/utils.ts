import { CITIES, type CityRecord } from './data.ts';
import type { City } from '../../types/index.ts';

// ---------------------------------------------------------------------------
// Haversine great-circle distance (km)
// ---------------------------------------------------------------------------
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // 验证坐标范围：纬度 -90~90，经度 -180~180
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    throw new Error(`Invalid latitude: must be between -90 and 90. Got lat1=${lat1}, lat2=${lat2}`);
  }
  if (lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180) {
    throw new Error(`Invalid longitude: must be between -180 and 180. Got lng1=${lng1}, lng2=${lng2}`);
  }

  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------------------------------------------------------------------------
// Rough transit time estimates for Chinese inter-city travel
// ---------------------------------------------------------------------------
function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} 分钟`;
  const half = Math.round(hours * 2) / 2;
  return `${half} 小时`;
}

export function estimateTransitTimes(km: number): {
  trainTime: string;
  driveTime: string;
  trainPrice: string;
  drivePrice: string;
} {
  // 处理负距离或无效距离
  if (km < 0 || !Number.isFinite(km)) {
    return {
      trainTime: '未知',
      driveTime: '未知',
      trainPrice: '未知',
      drivePrice: '未知',
    };
  }

  // 处理零距离特殊情况
  if (km === 0) {
    return {
      trainTime: '0 分钟',
      driveTime: '0 分钟',
      trainPrice: '约¥0',
      drivePrice: '约¥0',
    };
  }

  // HSR effective speed ~300 km/h; add 15 min fixed boarding overhead
  const trainH = 15 / 60 + km / 300;
  // Highway driving ~80 km/h
  const driveH = km / 80;
  // HSR 2nd class fare: ~0.47 yuan/km (matches real G-train pricing)
  const trainYuan = Math.round(km * 0.47 / 5) * 5; // round to nearest 5
  // Driving total cost: ~0.6 yuan/km fuel + ~0.5 yuan/km highway toll
  const driveYuan = Math.round(km * 1.1 / 10) * 10; // round to nearest 10
  return {
    trainTime: formatDuration(trainH),
    driveTime: formatDuration(driveH),
    trainPrice: `约¥${trainYuan}`,
    drivePrice: `约¥${driveYuan}`,
  };
}

// ---------------------------------------------------------------------------
// Find cities in the local DB within maxDistance km of (originLat, originLng).
// Excludes the origin city itself (matched by name).
// Returns results sorted by distance ascending, as City objects.
// ---------------------------------------------------------------------------
export function findNearbyFromCoords(
  originLat: number,
  originLng: number,
  maxDistance: number,
  excludeName?: string,
): City[] {
  const results: City[] = [];

  for (const city of CITIES) {
    if (excludeName && city.name === excludeName) continue;
    const dist = Math.round(haversineDistance(originLat, originLng, city.lat, city.lng));
    if (dist <= maxDistance) {
      const { trainTime, driveTime, trainPrice, drivePrice } = estimateTransitTimes(dist);
      results.push({
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        qweatherId: city.qweatherId,
        distance: dist,
        trainTime,
        driveTime,
        trainPrice,
        drivePrice,
      });
    }
  }

  results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  return results;
}

// ---------------------------------------------------------------------------
// Local DB helpers
// ---------------------------------------------------------------------------
export function getCityByName(name: string): CityRecord | undefined {
  return CITIES.find((c) => c.name === name);
}

export function getAllCityNames(): string[] {
  return CITIES.map((c) => c.name);
}
