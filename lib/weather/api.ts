import type { WeatherData, WeatherCondition } from '@/types';

const GEO_API_BASE = 'https://geoapi.qweather.com/v2';
const WEATHER_API_BASE = 'https://devapi.qweather.com/v7';
const PRODUCTION_WEATHER_API_BASE = 'https://api.qweather.com/v7';

function getWeatherApiBase(): string {
  return process.env.NODE_ENV === 'production' ? PRODUCTION_WEATHER_API_BASE : WEATHER_API_BASE;
}

function getApiKey(): string {
  const key = process.env.WEATHER_API_KEY;
  if (!key) {
    throw new Error('WEATHER_API_KEY environment variable is not set');
  }
  return key;
}

function mapWeatherTextToCondition(weatherText: string): WeatherCondition {
  if (weatherText.includes('晴') || weatherText.includes('少云')) {
    return 'sunny';
  }
  if (weatherText.includes('多云') || weatherText.includes('晴间多云')) {
    return 'cloudy';
  }
  if (weatherText.includes('雨')) {
    return 'rainy';
  }
  if (weatherText.includes('雪')) {
    return 'snowy';
  }
  return 'overcast';
}

function calculateScore(
  weather: WeatherCondition,
  humidity: number,
  precipitation: number
): number {
  let score = 100;

  switch (weather) {
    case 'rainy':
      score -= 50;
      break;
    case 'snowy':
      score -= 40;
      break;
    case 'overcast':
      score -= 20;
      break;
    case 'cloudy':
      score -= 10;
      break;
  }

  if (humidity > 70) {
    score -= 15;
  } else if (humidity > 60) {
    score -= 5;
  }

  if (precipitation > 0) {
    score -= Math.min(precipitation, 20);
  }

  return Math.max(0, Math.min(100, score));
}

export async function fetchWeather(city: string, date: string): Promise<WeatherData> {
  const apiKey = getApiKey();
  const weatherApiBase = getWeatherApiBase();

  const geoResponse = await fetch(
    `${GEO_API_BASE}/city/lookup?location=${encodeURIComponent(city)}&key=${apiKey}`
  );

  if (!geoResponse.ok) {
    throw new Error(`Failed to lookup city: ${geoResponse.statusText}`);
  }

  const geoData = await geoResponse.json();

  if (geoData.code !== '200' || !geoData.location || geoData.location.length === 0) {
    throw new Error(`City not found: ${city}`);
  }

  const cityId = geoData.location[0].id;
  const cityName = geoData.location[0].name;

  const weatherResponse = await fetch(
    `${weatherApiBase}/weather/7d?location=${cityId}&key=${apiKey}`
  );

  if (!weatherResponse.ok) {
    throw new Error(`Failed to fetch weather: ${weatherResponse.statusText}`);
  }

  const weatherData = await weatherResponse.json();

  if (weatherData.code !== '200' || !weatherData.daily || weatherData.daily.length === 0) {
    throw new Error(`Weather data not available for city: ${city}`);
  }

  const dayForecast = weatherData.daily.find((day: { fxDate: string }) => day.fxDate === date);

  if (!dayForecast) {
    throw new Error(`Weather forecast not found for date: ${date}`);
  }

  const weatherText = dayForecast.textDay;
  const weather = mapWeatherTextToCondition(weatherText);
  const humidity = parseInt(dayForecast.humidity, 10) || 0;
  const precipitation = parseFloat(dayForecast.precip) || 0;
  const score = calculateScore(weather, humidity, precipitation);

  return {
    city: cityName,
    date,
    weather,
    tempHigh: parseInt(dayForecast.tempMax, 10) || 0,
    tempLow: parseInt(dayForecast.tempMin, 10) || 0,
    rainProbability: precipitation > 0 ? Math.min(100, precipitation * 10) : 0,
    humidity,
    windSpeed: parseInt(dayForecast.windSpeedDay, 10) || 0,
    score,
    weatherText,
  };
}
