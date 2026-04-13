import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOriginCity, searchQWeatherNearbyCities } from '../lib/cities/lookup.ts';
import { UpstreamServiceError } from '../lib/errors.ts';
import { getCityByName } from '../lib/cities/utils.ts';

const originalFetch = global.fetch;
const originalApiKey = process.env.WEATHER_API_KEY;
const originalApiHost = process.env.WEATHER_API_HOST;

// =============================================================================
// resolveOriginCity 测试
// =============================================================================

test.beforeEach(() => {
  process.env.WEATHER_API_KEY = 'test-key';
  process.env.WEATHER_API_HOST = 'test.re.qweatherapi.com';
});

test.after(() => {
  global.fetch = originalFetch;
  if (originalApiKey === undefined) {
    delete process.env.WEATHER_API_KEY;
  } else {
    process.env.WEATHER_API_KEY = originalApiKey;
  }
  if (originalApiHost === undefined) {
    delete process.env.WEATHER_API_HOST;
  } else {
    process.env.WEATHER_API_HOST = originalApiHost;
  }
});

test('resolveOriginCity finds city from local DB', async () => {
  // Shanghai is in the local DB
  const result = await resolveOriginCity('上海');
  assert.ok(result !== null, 'Should find Shanghai');
  assert.equal(result?.name, '上海');
  assert.ok(result?.lat !== undefined);
  assert.ok(result?.lng !== undefined);
});

test('resolveOriginCity finds Beijing from local DB', async () => {
  const result = await resolveOriginCity('北京');
  assert.ok(result !== null, 'Should find Beijing');
  assert.equal(result?.name, '北京');
  assert.equal(result?.lat, 39.9042);
  assert.equal(result?.lng, 116.4074);
});

test('resolveOriginCity returns null for unknown city without API', async () => {
  // Mock fetch to return empty result
  global.fetch = async () => {
    return new Response(JSON.stringify({ code: '200', location: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const result = await resolveOriginCity('未知城市');
  assert.equal(result, null, 'Should return null for unknown city');
});

test('resolveOriginCity uses QWeather API fallback for unknown city', async () => {
  global.fetch = async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/geo/v2/city/lookup')) {
      return new Response(JSON.stringify({
        code: '200',
        location: [{
          id: '999999',
          name: '测试城市',
          lat: '35.0000',
          lon: '115.0000',
          adm1: '测试省',
          adm2: '测试市',
          type: 'city',
        }],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw new Error('Unexpected fetch call');
  };
  
  const result = await resolveOriginCity('测试城市');
  assert.ok(result !== null, 'Should find city via API');
  assert.equal(result?.name, '测试城市');
  assert.equal(result?.lat, 35.0);
  assert.equal(result?.lng, 115.0);
});

test('resolveOriginCity returns null when API returns empty location', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({ code: '200', location: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const result = await resolveOriginCity('不存在的城市');
  assert.equal(result, null, 'Should return null for empty API response');
});

test('resolveOriginCity returns null when API returns error code', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({ code: '401', location: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const result = await resolveOriginCity('测试');
  assert.equal(result, null, 'Should return null for API error code');
});

test('resolveOriginCity throws UpstreamServiceError on network failure', async () => {
  global.fetch = async () => {
    throw new Error('Network error');
  };
  
  await assert.rejects(
    async () => resolveOriginCity('测试'),
    UpstreamServiceError,
    'Should throw UpstreamServiceError on network failure'
  );
});

test('resolveOriginCity throws UpstreamServiceError on timeout', async () => {
  global.fetch = async () => {
    // Simulate timeout
    await new Promise(resolve => setTimeout(resolve, 10000));
    return new Response('timeout');
  };
  
  await assert.rejects(
    async () => resolveOriginCity('测试'),
    UpstreamServiceError,
    'Should throw UpstreamServiceError on timeout'
  );
});

test('resolveOriginCity caches results', async () => {
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount++;
    return new Response(JSON.stringify({
      code: '200',
      location: [{
        id: '111111',
        name: '缓存城市',
        lat: '30.0000',
        lon: '120.0000',
        adm1: '测试',
        adm2: '测试',
        type: 'city',
      }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  // First call
  const result1 = await resolveOriginCity('缓存城市');
  assert.ok(result1 !== null);
  const firstFetchCount = fetchCount;
  
  // Second call should use cache
  const result2 = await resolveOriginCity('缓存城市');
  assert.ok(result2 !== null);
  assert.equal(fetchCount, firstFetchCount, 'Second call should use cache');
});

test('resolveOriginCity handles empty string input', async () => {
  // Empty string should not match any local city
  global.fetch = async () => {
    return new Response(JSON.stringify({ code: '200', location: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const result = await resolveOriginCity('');
  assert.equal(result, null, 'Should return null for empty string');
});

// =============================================================================
// searchQWeatherNearbyCities 测试
// =============================================================================

test('searchQWeatherNearbyCities returns cities from API response', async () => {
  global.fetch = async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/geo/v2/city/lookup')) {
      return new Response(JSON.stringify({
        code: '200',
        location: [
          {
            id: '101210101',
            name: '杭州',
            lat: '30.2741',
            lon: '120.1551',
            adm1: '浙江',
            adm2: '杭州',
            type: 'city',
          },
          {
            id: '101190401',
            name: '苏州',
            lat: '31.2989',
            lon: '120.5853',
            adm1: '江苏',
            adm2: '苏州',
            type: 'city',
          },
        ],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw new Error('Unexpected fetch call');
  };
  
  // Shanghai coords: 31.2304, 121.4737
  const cities = await searchQWeatherNearbyCities(31.2304, 121.4737, 200);
  assert.ok(cities.length > 0, 'Should return cities');
  assert.ok(cities.some(c => c.name === '杭州' || c.name === '苏州'), 'Should include returned cities');
});

test('searchQWeatherNearbyCities filters by maxDistance', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({
      code: '200',
      location: [
        {
          id: 'near',
          name: '近城市',
          lat: '31.0000',  // ~30km from Shanghai
          lon: '121.0000',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
        {
          id: 'far',
          name: '远城市',
          lat: '40.0000',  // Very far from Shanghai
          lon: '116.0000',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const cities = await searchQWeatherNearbyCities(31.2304, 121.4737, 100);
  assert.ok(cities.some(c => c.name === '近城市'), 'Should include near city');
  assert.ok(!cities.some(c => c.name === '远城市'), 'Should exclude far city');
});

test('searchQWeatherNearbyCities excludes origin city by name', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({
      code: '200',
      location: [
        {
          id: 'origin',
          name: '上海',
          lat: '31.2304',
          lon: '121.4737',
          adm1: '上海',
          adm2: '上海',
          type: 'city',
        },
        {
          id: 'other',
          name: '苏州',
          lat: '31.2989',
          lon: '120.5853',
          adm1: '江苏',
          adm2: '苏州',
          type: 'city',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const cities = await searchQWeatherNearbyCities(31.2304, 121.4737, 200, '上海');
  assert.ok(!cities.some(c => c.name === '上海'), 'Should exclude origin city');
  assert.ok(cities.some(c => c.name === '苏州'), 'Should include other cities');
});

test('searchQWeatherNearbyCities excludes very close cities (min 10km)', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({
      code: '200',
      location: [
        {
          id: 'tooClose',
          name: '太近城市',
          lat: '31.2350',  // Very close to Shanghai
          lon: '121.4800',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
        {
          id: 'ok',
          name: '合适城市',
          lat: '31.5000',  // Further away
          lon: '120.5000',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const cities = await searchQWeatherNearbyCities(31.2304, 121.4737, 200);
  assert.ok(!cities.some(c => c.name === '太近城市'), 'Should exclude cities < 10km');
  assert.ok(cities.some(c => c.name === '合适城市'), 'Should include cities >= 10km');
});

test('searchQWeatherNearbyCities returns empty array for API error code', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({ code: '401', location: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const cities = await searchQWeatherNearbyCities(31.2304, 121.4737, 200);
  assert.equal(cities.length, 0, 'Should return empty array for API error');
});

test('searchQWeatherNearbyCities throws on HTTP error', async () => {
  global.fetch = async () => {
    return new Response('Service unavailable', { status: 503 });
  };
  
  await assert.rejects(
    async () => searchQWeatherNearbyCities(31.2304, 121.4737, 200),
    UpstreamServiceError,
    'Should throw UpstreamServiceError on HTTP error'
  );
});

test('searchQWeatherNearbyCities handles non-array location gracefully', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({ code: '200', location: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const cities = await searchQWeatherNearbyCities(31.2304, 121.4737, 200);
  assert.equal(cities.length, 0, 'Should return empty array for non-array location');
});

test('searchQWeatherNearbyCities removes duplicates by ID', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({
      code: '200',
      location: [
        {
          id: 'duplicate',
          name: '重复城市 1',
          lat: '31.0000',
          lon: '121.0000',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
        {
          id: 'duplicate',  // Same ID
          name: '重复城市 2',
          lat: '31.0001',
          lon: '121.0001',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
        {
          id: 'unique',
          name: '唯一城市',
          lat: '31.5000',
          lon: '120.5000',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const cities = await searchQWeatherNearbyCities(31.2304, 121.4737, 200);
  const duplicateCities = cities.filter(c => c.qweatherId === 'duplicate');
  assert.equal(duplicateCities.length, 1, 'Should remove duplicate IDs');
});

test('searchQWeatherNearbyCities includes transport info for each city', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({
      code: '200',
      location: [
        {
          id: '101210101',
          name: '杭州',
          lat: '30.2741',
          lon: '120.1551',
          adm1: '浙江',
          adm2: '杭州',
          type: 'city',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const cities = await searchQWeatherNearbyCities(31.2304, 121.4737, 200);
  assert.ok(cities.length > 0);
  for (const city of cities) {
    assert.ok(city.trainTime !== undefined, 'Should have train time');
    assert.ok(city.driveTime !== undefined, 'Should have drive time');
    assert.ok(city.trainPrice !== undefined, 'Should have train price');
    assert.ok(city.drivePrice !== undefined, 'Should have drive price');
    assert.ok(city.distance !== undefined, 'Should have distance');
    assert.ok(city.province !== undefined, 'Should have province');
  }
});

test('searchQWeatherNearbyCities sorts results by distance', async () => {
  global.fetch = async () => {
    return new Response(JSON.stringify({
      code: '200',
      location: [
        {
          id: 'far',
          name: '远城市',
          lat: '35.0000',
          lon: '118.0000',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
        {
          id: 'near',
          name: '近城市',
          lat: '31.0000',
          lon: '121.0000',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
        {
          id: 'mid',
          name: '中距离城市',
          lat: '32.0000',
          lon: '120.0000',
          adm1: '测试',
          adm2: '测试',
          type: 'city',
        },
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  const cities = await searchQWeatherNearbyCities(31.2304, 121.4737, 600);
  assert.ok(cities.length >= 2, `Should have at least 2 cities, got ${cities.length}`);
  for (let i = 1; i < cities.length; i++) {
    assert.ok(cities[i].distance! >= cities[i - 1].distance!, 'Should be sorted by distance');
  }
});
