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
  tempSpread: number,
  uvIndex?: number,
  windSpeed?: number,
  pressure?: number
): number {
  let score = 100;
  const worstWeather = nightWeather && mapSeverity(nightWeather) > mapSeverity(dayWeather) ? nightWeather : dayWeather;

  // 1. 天气状况扣分 (最大 -50)
  switch (worstWeather) {
    case 'rainy': score -= 50; break;
    case 'snowy': score -= 40; break;
    case 'overcast': score -= 20; break;
    case 'cloudy': score -= 10; break;
  }

  // 2. 湿度扣分 (最大 -15)
  if (humidity > 80) score -= 15;
  else if (humidity > 70) score -= 10;
  else if (humidity > 60) score -= 5;

  // 3. 降水扣分 (最大 -15)
  if (precip > 10) score -= 15;
  else if (precip > 5) score -= 10;
  else if (precip > 0) score -= Math.min(precip * 2, 10);

  // 4. 能见度扣分 (最大 -10)
  if (vis > 0 && vis < 3) score -= 10;  // 严重雾霾
  else if (vis > 0 && vis < 5) score -= 7;
  else if (vis > 0 && vis < 10) score -= 3;

  // 5. 温差扣分 (最大 -5)
  if (tempSpread > 15) score -= 5;
  else if (tempSpread > 10) score -= 2;

  // 6. 紫外线指数 (新增：过高或过低都扣分，最大 -5)
  if (uvIndex !== undefined) {
    if (uvIndex >= 11) score -= 5;  // 极端紫外线
    else if (uvIndex >= 8) score -= 3;  // 很强
    else if (uvIndex <= 1 && dayWeather === 'sunny') score -= 2;  // 冬季阳光不足
  }

  // 7. 风速扣分 (新增：大风不舒适，最大 -5)
  if (windSpeed !== undefined) {
    if (windSpeed > 50) score -= 5;  // 大风
    else if (windSpeed > 30) score -= 3;  // 较强风
    else if (windSpeed > 20) score -= 1;  // 微风
  }

  // 8. 气压扣分 (新增：气压过低可能表示恶劣天气，最大 -3)
  if (pressure !== undefined) {
    if (pressure < 980) score -= 3;  // 低气压
    else if (pressure < 1000) score -= 1;
  }

  // NaN 检查：如果最终分数为 NaN，返回默认值 50
  if (Number.isNaN(score)) {
    return 50;
  }

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
  const windSpeed = parseInt(dayForecast.windSpeedDay, 10) || 0;
  const uvIndex = parseInt(dayForecast.uvIndex, 10) || undefined;
  const pressure = parseInt(dayForecast.pressure, 10) || undefined;
  const score = calculateScore(weather, weatherNight, humidity, precip, vis, tempHigh - tempLow, uvIndex, windSpeed, pressure);

  return {
    city: cityName,
    date,
    weather,
    tempHigh,
    tempLow,
    rainProbability: estimateRainProbability(textDay, precip),
    humidity,
    windSpeed,
    score,
    weatherText: textDay,
    textNight,
    weatherNight,
    windDirDay: dayForecast.windDirDay,
    windScaleDay: dayForecast.windScaleDay,
    vis,
    uvIndex,
    sunrise: dayForecast.sunrise,
    sunset: dayForecast.sunset,
    pressure,
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
