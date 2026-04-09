import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const weatherPort = 4011;
const appPort = 3012;
const appBaseUrl = `http://127.0.0.1:${appPort}`;

function createWeatherServer() {
  return createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (req.url.startsWith('/v7/weather/7d')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        daily: [
          {
            fxDate: '2026-04-10',
            textDay: '晴',
            textNight: '多云',
            humidity: '48',
            precip: '0',
            vis: '25',
            tempMax: '24',
            tempMin: '16',
            windSpeedDay: '12',
            windDirDay: '东南风',
            windScaleDay: '3',
            uvIndex: '6',
            sunrise: '05:32',
            sunset: '18:21',
            pressure: '1018',
          },
        ],
      }));
      return;
    }

    if (req.url.startsWith('/geo/v2/city/lookup')) {
      const url = new URL(req.url, `http://127.0.0.1:${weatherPort}`);
      const location = url.searchParams.get('location');
      res.setHeader('Content-Type', 'application/json');
      if (location === '121.5440,29.8683') {
        res.end(JSON.stringify({
          code: '200',
          location: [
            { id: '101210507', name: '绍兴', lat: '30.0003', lon: '120.5820', adm1: '浙江', adm2: '绍兴', type: 'city' },
            { id: '101211101', name: '舟山', lat: '29.9852', lon: '122.2074', adm1: '浙江', adm2: '舟山', type: 'city' },
            { id: '101210301', name: '嘉兴', lat: '30.7467', lon: '120.7508', adm1: '浙江', adm2: '嘉兴', type: 'city' },
          ],
        }));
        return;
      }

      res.end(JSON.stringify({
        code: '200',
        location: [
          {
            id: location === '宁波' ? '101210401' : '101020100',
            name: location === '宁波' ? '宁波' : '上海',
            lat: location === '宁波' ? '29.8683' : '31.2304',
            lon: location === '宁波' ? '121.5440' : '121.4737',
          },
        ],
      }));
      return;
    }

    res.statusCode = 404;
    res.end();
  });
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is not ready yet.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for server: ${url}`);
}

async function assertJson(path, expectedStatus, assertBody) {
  const response = await fetch(`${appBaseUrl}${path}`);
  const body = await response.json();

  if (response.status !== expectedStatus) {
    throw new Error(`${path}: expected ${expectedStatus}, got ${response.status}, body=${JSON.stringify(body)}`);
  }

  assertBody(body);
}

async function assertCitiesUsesDynamicSearch() {
  const response = await fetch(`${appBaseUrl}/api/cities?city=%E5%AE%81%E6%B3%A2&maxDistance=200`);
  const body = await response.json();

  if (response.status !== 200) {
    throw new Error(`/api/cities dynamic search expected 200, got ${response.status}, body=${JSON.stringify(body)}`);
  }

  if (!Array.isArray(body.cities) || body.cities.length === 0) {
    throw new Error(`expected dynamic nearby cities, got ${JSON.stringify(body)}`);
  }

  if (!body.cities.some((city) => city.province === '浙江')) {
    throw new Error(`expected dynamic city data with province metadata, got ${JSON.stringify(body)}`);
  }
}

const weatherServer = createWeatherServer();
await new Promise((resolve) => weatherServer.listen(weatherPort, '127.0.0.1', resolve));

const appServer = spawn('npm', ['run', 'dev', '--', '--port', String(appPort)], {
  env: {
    ...process.env,
    WEATHER_API_HOST: `http://127.0.0.1:${weatherPort}`,
    WEATHER_API_KEY: 'test-key',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

appServer.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
});

appServer.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
});

try {
  await waitForServer(`${appBaseUrl}/api/cities`);

  await assertJson('/api/cities?city=%E4%B8%8A%E6%B5%B7&maxDistance=200', 200, (body) => {
    if (body.count !== 9) {
      throw new Error(`expected 9 nearby cities, got ${body.count}`);
    }
  });
  console.log('PASS cities success path');

  await assertCitiesUsesDynamicSearch();
  console.log('PASS cities dynamic nearby search');

  await assertJson('/api/weather?city=%E4%B8%8A%E6%B5%B7&date=2026-04-10', 200, (body) => {
    if (body.city !== '上海' || body.score !== 90 || body.weather !== 'sunny') {
      throw new Error(`unexpected weather body: ${JSON.stringify(body)}`);
    }
  });
  console.log('PASS weather success path');

  await assertJson('/api/weather?city=%E4%B8%8A%E6%B5%B7&date=2026-04-10', 200, (body) => {
    if (body.cached !== true) {
      throw new Error(`expected cached weather response, got ${JSON.stringify(body)}`);
    }
  });
  console.log('PASS weather cache hit');
} finally {
  appServer.kill('SIGINT');
  await delay(1000);
  await new Promise((resolve, reject) => weatherServer.close((error) => error ? reject(error) : resolve()));
}
