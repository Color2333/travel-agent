import test from 'node:test';
import assert from 'node:assert/strict';
import { planTrip } from '../lib/ai/plan-trip.ts';
import { weatherCache } from '../lib/weather/cache.ts';

const originalFetch = global.fetch;
const originalApiKey = process.env.WEATHER_API_KEY;

function weatherPayload(textDay, overrides = {}) {
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

  global.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input.url;
    const parsed = new URL(url);
    const location = parsed.searchParams.get('location');

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
  assert.equal(result.failedCities.length, 1);
  assert.equal(result.failedCities[0].city, '舟山');
  assert.equal(result.topRecommendation?.city, '杭州');
  assert.equal(result.goodOptions.some((item) => item.city === '杭州'), true);
  assert.equal(result.avoidCities.some((item) => item.city === '苏州'), true);
  assert.match(result.summary, /8个城市中/);
});

test('planTrip returns a clear error when every city weather lookup fails', async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ error: { title: 'upstream down' } }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });

  const result = await planTrip('上海', '2026-04-10', 100);

  assert.equal(result.cities.length, 0);
  assert.equal(result.failedCities.length, 2);
  assert.equal(result.error, '天气服务暂时不可用，请稍后再试');
});
