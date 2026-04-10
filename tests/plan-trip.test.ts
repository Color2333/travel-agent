import test from 'node:test';
import assert from 'node:assert/strict';
import { planTrip } from '../lib/ai/plan-trip.ts';
import { weatherCache } from '../lib/weather/cache.ts';

const originalFetch = global.fetch;
const originalApiKey = process.env.WEATHER_API_KEY;

function weatherPayload(textDay: string, overrides: Record<string, string> = {}) {
  return {
    daily: [
      {
        fxDate: '2026-04-10',
        textDay,
        textNight: '晴',
        humidity: '45',
        precip: '0',
        vis: '20',
        tempMax: '24',
        tempMin: '16',
        windSpeedDay: '12',
        windDirDay: '东风',
        windScaleDay: '3',
        uvIndex: '6',
        sunrise: '05:32',
        sunset: '18:21',
        pressure: '1018',
        ...overrides,
      },
    ],
  };
}

test.beforeEach(() => {
  weatherCache.clear();
  process.env.WEATHER_API_KEY = 'test-key';
});

test.after(() => {
  global.fetch = originalFetch;
  if (originalApiKey === undefined) {
    delete process.env.WEATHER_API_KEY;
  } else {
    process.env.WEATHER_API_KEY = originalApiKey;
  }
});

test('planTrip sorts cities, returns failures, and exposes top recommendation', async () => {
  const payloads = new Map([
    ['101210101', weatherPayload('晴')],
    ['101190401', weatherPayload('小雨', { precip: '12', humidity: '90', vis: '4' })],
    ['101190201', weatherPayload('多云')],
    ['101210301', weatherPayload('晴间多云')],
    ['101210401', weatherPayload('阴')],
    ['101190101', weatherPayload('晴')],
    ['101190601', weatherPayload('晴')],
    ['101210507', weatherPayload('晴')],
  ]);

  global.fetch = async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const parsed = new URL(url);
    const location = parsed.searchParams.get('location');

    if (parsed.pathname.includes('/geo/v2/city/lookup')) {
      if (location === '121.4737,31.2304') {
        return new Response(JSON.stringify({
          code: '200',
          location: [
            { id: '101210101', name: '杭州', lat: '30.2741', lon: '120.1551', adm1: '浙江', adm2: '杭州', type: 'city' },
            { id: '101190401', name: '苏州', lat: '31.2989', lon: '120.5853', adm1: '江苏', adm2: '苏州', type: 'city' },
            { id: '101190201', name: '无锡', lat: '31.4912', lon: '120.3119', adm1: '江苏', adm2: '无锡', type: 'city' },
            { id: '101210301', name: '嘉兴', lat: '30.7467', lon: '120.7508', adm1: '浙江', adm2: '嘉兴', type: 'city' },
            { id: '101210401', name: '宁波', lat: '29.8683', lon: '121.5440', adm1: '浙江', adm2: '宁波', type: 'city' },
            { id: '101190101', name: '南京', lat: '32.0603', lon: '118.7969', adm1: '江苏', adm2: '南京', type: 'city' },
            { id: '101190601', name: '扬州', lat: '32.3942', lon: '119.4217', adm1: '江苏', adm2: '扬州', type: 'city' },
            { id: '101210507', name: '绍兴', lat: '30.0003', lon: '120.5820', adm1: '浙江', adm2: '绍兴', type: 'city' },
            { id: '101211101', name: '舟山', lat: '29.9852', lon: '122.2074', adm1: '浙江', adm2: '舟山', type: 'city' },
          ],
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`unexpected geo lookup: ${location}`);
    }

    if (location === '101211101') {
      return new Response(JSON.stringify({ error: { title: 'rate limited' } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = payloads.get(location ?? '');
    if (!body) {
      throw new Error(`unexpected location: ${location}`);
    }

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const result = await planTrip('上海', '2026-04-10', 300);

  assert.equal(result.origin, '上海');
  assert.equal(result.cities.length, 8);
  assert.equal(result.failedCities?.length, 1);
  assert.equal(result.failedCities?.[0]?.city, '舟山');
  assert.equal(result.topRecommendation?.score, 100);
  assert.equal(['杭州', '嘉兴', '南京', '扬州', '绍兴'].includes(result.topRecommendation?.city ?? ''), true);
  assert.equal(result.goodOptions?.some((item) => item.city === '杭州'), true);
  assert.equal(result.avoidCities?.some((item) => item.city === '苏州'), true);
  assert.match(result.summary ?? '', /8个城市中/);
});

test('planTrip returns a clear error when every city weather lookup fails', async () => {
  global.fetch = async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const parsed = new URL(url);

    if (parsed.pathname.includes('/geo/v2/city/lookup')) {
      return new Response(JSON.stringify({ code: '200', location: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: { title: 'upstream down' } }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const result = await planTrip('上海', '2026-04-10', 100);

  assert.equal(result.cities.length, 0);
  assert.equal(result.failedCities?.length, 2);
  assert.equal(result.error, '天气服务暂时不可用，请稍后再试');
});

test('weather cache keeps same-name cities separate when qweatherId differs', () => {
  weatherCache.set('宜春', '2026-04-10', {
    city: '宜春',
    date: '2026-04-10',
    weather: 'sunny',
    tempHigh: 28,
    tempLow: 19,
    rainProbability: 5,
    humidity: 40,
    windSpeed: 2,
    score: 95,
  }, 'city-a');

  weatherCache.set('宜春', '2026-04-10', {
    city: '宜春',
    date: '2026-04-10',
    weather: 'rainy',
    tempHigh: 22,
    tempLow: 17,
    rainProbability: 80,
    humidity: 88,
    windSpeed: 4,
    score: 20,
  }, 'city-b');

  assert.equal(weatherCache.get('宜春', '2026-04-10', 'city-a')?.score, 95);
  assert.equal(weatherCache.get('宜春', '2026-04-10', 'city-b')?.score, 20);
});
