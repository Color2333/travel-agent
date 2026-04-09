import type { WeatherData } from '../../types/index.ts';
import { RequestValidationError } from '../errors.ts';
import { getNearbyCities } from '../cities/utils.ts';
import { CITY_DATABASE } from '../cities/data.ts';
import { fetchWeather, fetchWeatherById } from '../weather/api.ts';
import { weatherCache } from '../weather/cache.ts';

export type TripWeatherResult = WeatherData & {
  distance: number | undefined;
  trainTime: string | undefined;
  driveTime: string | undefined;
};

export type TripCityFailure = {
  city: string;
  error: string;
};

export async function planTrip(city: string, date: string, maxDistance: number = 300) {
  try {
    const nearbyCities = getNearbyCities(city, maxDistance);
    if (nearbyCities.length === 0) {
      if (!(city in CITY_DATABASE)) {
        throw new RequestValidationError(`暂不支持 ${city} 的周边城市查询，目前仅支持上海出发`);
      }
      const allNearby = getNearbyCities(city, Infinity);
      const minDist = Math.min(...allNearby.map((c) => c.distance ?? 0));
      throw new RequestValidationError(
        `${city} 周边 ${maxDistance}km 内暂无支持的城市，最近的城市约 ${minDist}km，请适当增大搜索范围`
      );
    }

    const results = await Promise.all(
      nearbyCities.map(async (c) => {
        try {
          const cached = weatherCache.get(c.name, date);
          if (cached) {
            return { ...cached, distance: c.distance, trainTime: c.trainTime, driveTime: c.driveTime };
          }

          let weather: WeatherData;
          if (c.qweatherId) {
            weather = await fetchWeatherById(c.qweatherId, c.name, date);
          } else {
            weather = await fetchWeather(c.name, date);
          }

          weatherCache.set(c.name, date, weather);
          return { ...weather, distance: c.distance, trainTime: c.trainTime, driveTime: c.driveTime };
        } catch (error) {
          return {
            city: c.name,
            error: error instanceof Error ? error.message : 'Failed to fetch weather',
          };
        }
      })
    );

    const failedCities = results.filter((result): result is TripCityFailure => 'error' in result);
    const validResults = results.filter((result): result is TripWeatherResult => !('error' in result));

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
    const other = validResults.length - sunny - cloudy - rainy;

    const summary = `${validResults.length}个城市中，${sunny ? sunny + '个晴天' : ''}${cloudy ? (sunny ? '、' : '') + cloudy + '个多云' : ''}${rainy ? (sunny || cloudy ? '、' : '') + rainy + '个雨天' : ''}${other ? (sunny || cloudy || rainy ? '、' : '') + other + '个其他' : ''}`;

    const goodOptions = validResults.filter((r) => r.score >= 70).map((r) => ({
      city: r.city,
      score: r.score,
      weather: r.weatherText,
      tempHigh: r.tempHigh,
      tempLow: r.tempLow,
      rainProbability: r.rainProbability,
      trainTime: r.trainTime,
      reason: r.score >= 85 ? '天气优秀，强烈推荐' : '天气不错，适合出行',
    }));

    const avoidCities = validResults.filter((r) => r.score < 30).map((r) => ({
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
      failedCities,
      summary,
      topRecommendation,
      goodOptions,
      avoidCities,
    };
  } catch (error) {
    return { origin: city, date, error: error instanceof Error ? error.message : 'Unknown error', cities: [] };
  }
}
