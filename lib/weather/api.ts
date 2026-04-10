import type { WeatherData, WeatherCondition } from '../../types/index.ts';
import { getCityByName } from '../cities/utils.ts';
import { ResourceNotFoundError, UpstreamServiceError } from '../errors.ts';

const RAW_API_HOST = process.env.WEATHER_API_HOST || 'ma5pwe7m85.re.qweatherapi.com';
const API_ORIGIN = RAW_API_HOST.startsWith('http://') || RAW_API_HOST.startsWith('https://')
  ? RAW_API_HOST
  : `https://${RAW_API_HOST}`;
const GEO_API_BASE = `${API_ORIGIN}/geo/v2`;
const WEATHER_API_BASE = `${API_ORIGIN}/v7`;

function getApiKey(): string {
  const key = process.env.WEATHER_API_KEY;
  if (!key) throw new Error('WEATHER_API_KEY environment variable is not set');
  return key;
}

function mapWeatherTextToCondition(text: string): WeatherCondition {
  if (text.includes('晴') || text.includes('少云')) return 'sunny';
  if (text.includes('多云') || text.includes('晴间多云')) return 'cloudy';
  if (text.includes('雨')) return 'rainy';
  if (text.includes('雪')) return 'snowy';
  return 'overcast';
}

function estimateRainProbability(textDay: string, precip: number): number {
  if (textDay.includes('大雨') || textDay.includes('暴雨')) return 95;
  if (textDay.includes('中雨')) return 75;
  if (textDay.includes('雷阵雨')) return 70;
  if (textDay.includes('小雨') || textDay.includes('阵雨')) return 50;
  if (precip > 10) return 90;
  if (precip > 5) return 70;
  if (precip > 0) return 40;
  return 5;
}

function calculateScore(
  dayWeather: WeatherCondition,
  nightWeather: WeatherCondition | undefined,
  humidity: number,
  precip: number,
  vis: number,
  tempSpread: number
): number {
  let score = 100;
  const worstWeather = nightWeather && mapSeverity(nightWeather) > mapSeverity(dayWeather) ? nightWeather : dayWeather;

  switch (worstWeather) {
    case 'rainy': score -= 50; break;
    case 'snowy': score -= 40; break;
    case 'overcast': score -= 20; break;
    case 'cloudy': score -= 10; break;
  }

  if (humidity > 80) score -= 15;
  else if (humidity > 70) score -= 10;
  else if (humidity > 60) score -= 5;

  if (precip > 10) score -= 15;
  else if (precip > 0) score -= Math.min(precip * 2, 10);

  if (vis > 0 && vis < 5) score -= 10;
  else if (vis > 0 && vis < 10) score -= 5;

  if (tempSpread > 15) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function mapSeverity(w: WeatherCondition): number {
  switch (w) {
    case 'rainy': return 4;
    case 'snowy': return 3;
    case 'overcast': return 2;
    case 'cloudy': return 1;
    case 'sunny': return 0;
  }
}

function buildWeatherData(dayForecast: Record<string, string>, cityName: string, date: string): WeatherData {
  const textDay = dayForecast.textDay;
  const weather = mapWeatherTextToCondition(textDay);
  const textNight = dayForecast.textNight;
  const weatherNight = textNight ? mapWeatherTextToCondition(textNight) : undefined;
  const humidity = parseInt(dayForecast.humidity, 10) || 0;
  const precip = parseFloat(dayForecast.precip) || 0;
  const vis = parseInt(dayForecast.vis, 10) || 0;
  const tempHigh = parseInt(dayForecast.tempMax, 10) || 0;
  const tempLow = parseInt(dayForecast.tempMin, 10) || 0;
  const score = calculateScore(weather, weatherNight, humidity, precip, vis, tempHigh - tempLow);

  return {
    city: cityName,
    date,
    weather,
    tempHigh,
    tempLow,
    rainProbability: estimateRainProbability(textDay, precip),
    humidity,
    windSpeed: parseInt(dayForecast.windSpeedDay, 10) || 0,
    score,
    weatherText: textDay,
    textNight,
    weatherNight,
    windDirDay: dayForecast.windDirDay,
    windScaleDay: dayForecast.windScaleDay,
    vis,
    uvIndex: parseInt(dayForecast.uvIndex, 10) || undefined,
    sunrise: dayForecast.sunrise,
    sunset: dayForecast.sunset,
    pressure: parseInt(dayForecast.pressure, 10) || undefined,
  };
}

const FETCH_TIMEOUT_MS = 10_000;

export async function fetchWeatherById(cityId: string, cityName: string, date: string): Promise<WeatherData> {
  const apiKey = getApiKey();
  const res = await fetch(`${WEATHER_API_BASE}/weather/7d?location=${cityId}&key=${apiKey}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new UpstreamServiceError(`Weather service request failed for ${cityName}`);
  }

  const data = await res.json();

  // QWeather returns HTTP 200 for all responses; actual success is indicated by code === '200'
  if (data.code && data.code !== '200') {
    throw new UpstreamServiceError(`QWeather API error (code ${data.code}) for: ${cityName}`);
  }
  if (!data.daily) throw new UpstreamServiceError(`Weather data not available for: ${cityName}`);

  const day = data.daily.find((d: { fxDate: string }) => d.fxDate === date);
  if (!day) throw new ResourceNotFoundError(`No forecast for ${date} in ${cityName}`);

  return buildWeatherData(day, cityName, date);
}

export async function fetchWeatherForecast(cityId: string, cityName: string): Promise<WeatherData[]> {
  const apiKey = getApiKey();
  const res = await fetch(`${WEATHER_API_BASE}/weather/7d?location=${cityId}&key=${apiKey}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new UpstreamServiceError(`Weather service request failed for ${cityName}`);

  const data = await res.json();
  if (data.code && data.code !== '200') {
    throw new UpstreamServiceError(`QWeather API error (code ${data.code}) for: ${cityName}`);
  }
  if (!data.daily) throw new UpstreamServiceError(`Weather data not available for: ${cityName}`);

  return (data.daily as Record<string, string>[]).map((day) =>
    buildWeatherData(day, cityName, day.fxDate)
  );
}

export async function fetchWeather(city: string, date: string): Promise<WeatherData> {
  const apiKey = getApiKey();

  const cityInfo = getCityByName(city);
  if (cityInfo?.qweatherId) {
    return fetchWeatherById(cityInfo.qweatherId, cityInfo.name, date);
  }

  const geoRes = await fetch(`${GEO_API_BASE}/city/lookup?location=${encodeURIComponent(city)}&key=${apiKey}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!geoRes.ok) {
    throw new UpstreamServiceError(`Geo lookup failed for city: ${city}`);
  }

  const geoData = await geoRes.json();

  if (geoData.code && geoData.code !== '200') throw new UpstreamServiceError(`QWeather geo error (code ${geoData.code}) for: ${city}`);
  if (!geoData.location?.length) throw new ResourceNotFoundError(`City not found: ${city}`);

  const cityId = geoData.location[0].id;
  const cityName = geoData.location[0].name;

  return fetchWeatherById(cityId, cityName, date);
}
