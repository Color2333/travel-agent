import type { WeatherData } from '../../types/index.ts';
import { resolveNearbyCities } from '../cities/nearby.ts';
import { resolveOriginCity } from '../cities/lookup.ts';
import { fetchWeather, fetchWeatherById } from '../weather/api.ts';
import { weatherCache } from '../weather/cache.ts';

export type TripWeatherResult = WeatherData & {
  lat: number;
  lng: number;
  qweatherId: string | undefined;
  province: string | undefined;
  distance: number | undefined;
  trainTime: string | undefined;
  driveTime: string | undefined;
  trainPrice: string | undefined;
  drivePrice: string | undefined;
};

export type TripCityFailure = {
  city: string;
  error: string;
};

export async function planTrip(city: string, date: string, maxDistance: number = 300) {
  try {
    // 1. Resolve origin city coordinates
    const origin = await resolveOriginCity(city);
    if (!origin) {
      return {
        origin: city,
        date,
        error: `无法识别城市"${city}"，请检查城市名称是否正确`,
        cities: [],
      };
    }

    // 2. Find nearby cities (QWeather full DB + static fallback)
    const nearbyCities = await resolveNearbyCities(origin.lat, origin.lng, maxDistance, origin.name);
    if (nearbyCities.length === 0) {
      return {
        origin: city,
        date,
        error: `${city} 周边 ${maxDistance}km 内暂无数据，可尝试增大搜索范围（最大 1000km）`,
        cities: [],
      };
    }

    // 3. Batch fetch weather for all nearby cities
    const results = await Promise.all(
      nearbyCities.map(async (c) => {
        try {
          const cacheKey = c.qweatherId ?? `${c.name}_${c.province ?? ''}`;
          const cached = weatherCache.get(c.name, date, cacheKey);
          if (cached) {
            return {
              ...cached,
              lat: c.lat,
              lng: c.lng,
              qweatherId: c.qweatherId,
              province: c.province,
              distance: c.distance,
              trainTime: c.trainTime,
              driveTime: c.driveTime,
              trainPrice: c.trainPrice,
              drivePrice: c.drivePrice,
            };
          }

          let weather: WeatherData;
          if (c.qweatherId) {
            weather = await fetchWeatherById(c.qweatherId, c.name, date);
          } else {
            weather = await fetchWeather(c.name, date);
          }

          weatherCache.set(c.name, date, weather, cacheKey);
          return {
            ...weather,
            lat: c.lat,
            lng: c.lng,
            qweatherId: c.qweatherId,
            province: c.province,
            distance: c.distance,
            trainTime: c.trainTime,
            driveTime: c.driveTime,
            trainPrice: c.trainPrice,
            drivePrice: c.drivePrice,
          };
        } catch (error) {
          return {
            city: c.name,
            error: error instanceof Error ? error.message : 'Failed to fetch weather',
          };
        }
      })
    );

    const failedCities = results.filter((r): r is TripCityFailure => 'error' in r);
    const validResults = results.filter((r): r is TripWeatherResult => !('error' in r));

    if (validResults.length === 0) {
      return {
        origin: city,
        date,
        cities: [],
        failedCities,
        error: failedCities.length > 0 ? '天气服务暂时不可用，请稍后再试' : '没有可用的天气结果',
      };
    }

    validResults.sort((a, b) => b.score - a.score);

    const sunny = validResults.filter((r) => r.weather === 'sunny').length;
    const cloudy = validResults.filter((r) => r.weather === 'cloudy').length;
    const rainy = validResults.filter((r) => r.weather === 'rainy').length;
    const snowy = validResults.filter((r) => r.weather === 'snowy').length;
    const overcast = validResults.length - sunny - cloudy - rainy - snowy;

    const parts = [
      sunny && `${sunny}个晴天`,
      cloudy && `${cloudy}个多云`,
      rainy && `${rainy}个雨天`,
      snowy && `${snowy}个雪天`,
      overcast && `${overcast}个阴天`,
    ].filter(Boolean);
    const summary = `${validResults.length}个城市中，${parts.join('、')}`;

    const goodOptions = validResults.filter((r) => r.score >= 70).map((r) => ({
      city: r.city,
      score: r.score,
      weather: r.weatherText,
      tempHigh: r.tempHigh,
      tempLow: r.tempLow,
      rainProbability: r.rainProbability,
      trainTime: r.trainTime,
      trainPrice: r.trainPrice,
      reason: r.score >= 85 ? '天气优秀，强烈推荐' : '天气不错，适合出行',
    }));

    const avoidCities = validResults.filter((r) => r.score < 30).map((r) => ({
      city: r.city,
      score: r.score,
      weather: r.weatherText,
      reason: r.weatherText?.includes('雨') ? '有降雨，不建议出行' : '天气较差',
    }));

    const top = validResults[0];
    const topRecommendation = {
      city: top.city,
      score: top.score,
      weather: top.weatherText,
      tempHigh: top.tempHigh,
      tempLow: top.tempLow,
      trainTime: top.trainTime,
      trainPrice: top.trainPrice,
      reason: `天气评分最高(${top.score}分)`,
    };

    return {
      origin: city,
      date,
      cities: validResults,
      failedCities,
      summary,
      topRecommendation,
      goodOptions,
      avoidCities,
    };
  } catch (error) {
    // 脱敏错误信息，不泄露内部细节
    const isProd = process.env.NODE_ENV === 'production';
    const safeError = isProd 
      ? '服务暂时不可用，请稍后再试' 
      : (error instanceof Error ? error.message : 'Unknown error');
    
    return { 
      origin: city, 
      date, 
      error: safeError, 
      cities: [],
      ...(isProd ? {} : { debugError: error instanceof Error ? error.message : String(error) })
    };
  }
}
