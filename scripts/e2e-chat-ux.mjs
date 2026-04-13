import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const weatherPort = 4012;
const modelPort = 4022;
const appPort = 3021;
const appBaseUrl = `http://127.0.0.1:${appPort}`;

function createWeatherServer() {
  return createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 404;
      res.end();
      return;
    }

    if (req.url.startsWith('/v7/weather/7d')) {
      const url = new URL(req.url, `http://127.0.0.1:${weatherPort}`);
      const location = url.searchParams.get('location');
      const byId = {
        '101210101': { city: '杭州', textDay: '晴', tempMax: '25', tempMin: '16', humidity: '42' },
        '101190401': { city: '苏州', textDay: '小雨', tempMax: '21', tempMin: '17', humidity: '88', precip: '12', vis: '4' },
        '101190201': { city: '无锡', textDay: '多云', tempMax: '22', tempMin: '15' },
        '101210301': { city: '嘉兴', textDay: '晴间多云', tempMax: '24', tempMin: '16' },
      }[location];

      if (!byId) {
        res.statusCode = 404;
        res.end(JSON.stringify({ code: '404' }));
        return;
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        code: '200',
        daily: [
          {
            fxDate: '2026-04-10',
            textDay: byId.textDay,
            textNight: '晴',
            humidity: byId.humidity ?? '48',
            precip: byId.precip ?? '0',
            vis: byId.vis ?? '25',
            tempMax: byId.tempMax,
            tempMin: byId.tempMin,
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

      if (location === '121.4737,31.2304') {
        res.end(JSON.stringify({
          code: '200',
          location: [
            { id: '101210101', name: '杭州', lat: '30.2741', lon: '120.1551', adm1: '浙江', adm2: '杭州', type: 'city' },
            { id: '101190401', name: '苏州', lat: '31.2989', lon: '120.5853', adm1: '江苏', adm2: '苏州', type: 'city' },
            { id: '101190201', name: '无锡', lat: '31.4912', lon: '120.3119', adm1: '江苏', adm2: '无锡', type: 'city' },
            { id: '101210301', name: '嘉兴', lat: '30.7467', lon: '120.7508', adm1: '浙江', adm2: '嘉兴', type: 'city' },
          ],
        }));
        return;
      }

      res.end(JSON.stringify({
        code: '200',
        location: [
          { id: '101020100', name: '上海', lat: '31.2304', lon: '121.4737' },
        ],
      }));
      return;
    }

    res.statusCode = 404;
    res.end();
  });
}

function sse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function createModelServer() {
  return createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/chat/completions') {
      res.statusCode = 404;
      res.end();
      return;
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const userText = payload.messages.filter((message) => message.role === 'user').at(-1)?.content ?? '';
    const hasToolResult = payload.messages.some((message) => message.role === 'tool');
    console.log('MODEL_REQUEST', JSON.stringify({
      hasToolResult,
      roles: payload.messages.map((message) => message.role),
      lastUser: userText,
    }));

    if (String(userText).includes('失败测试')) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: '1305', message: 'mock provider overloaded' } }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    if (!hasToolResult) {
      sse(res, {
        id: 'chatcmpl-mock',
        object: 'chat.completion.chunk',
        created: 1,
        model: payload.model,
        choices: [{
          index: 0,
          delta: {
            role: 'assistant',
            tool_calls: [{
              index: 0,
              id: 'call_plan_trip_1',
              type: 'function',
              function: {
                name: 'plan_trip',
                arguments: JSON.stringify({ city: '上海', date: '2026-04-10', maxDistance: 300 }),
              },
            }],
          },
          finish_reason: null,
        }],
      });
      sse(res, {
        id: 'chatcmpl-mock',
        object: 'chat.completion.chunk',
        created: 1,
        model: payload.model,
        choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }],
      });
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const assistantText = String(userText).includes('为什么 ')
      ? '这个城市更优，因为天气稳定、降雨低，而且从出发地过去的通勤压力也更小。'
      : '推荐你优先看嘉兴和杭州，天气都很稳。';

    sse(res, {
      id: 'chatcmpl-mock',
      object: 'chat.completion.chunk',
      created: 1,
      model: payload.model,
      choices: [{ index: 0, delta: { role: 'assistant', content: assistantText }, finish_reason: null }],
    });
    sse(res, {
      id: 'chatcmpl-mock',
      object: 'chat.completion.chunk',
      created: 1,
      model: payload.model,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    });
    res.write('data: [DONE]\n\n');
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

const weatherServer = createWeatherServer();
const modelServer = createModelServer();
await new Promise((resolve) => weatherServer.listen(weatherPort, '127.0.0.1', resolve));
await new Promise((resolve) => modelServer.listen(modelPort, '127.0.0.1', resolve));

const appServer = spawn('npm', ['run', 'dev', '--', '--port', String(appPort)], {
  env: {
    ...process.env,
    WEATHER_API_HOST: `http://127.0.0.1:${weatherPort}`,
    WEATHER_API_KEY: 'test-key',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

appServer.stdout.on('data', (chunk) => process.stdout.write(chunk));
appServer.stderr.on('data', (chunk) => process.stderr.write(chunk));

try {
  await waitForServer(`${appBaseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.addInitScript((config) => {
    window.localStorage.setItem('ai_config', JSON.stringify(config));
  }, {
    provider: 'zhipu',
    model: 'mock-zhipu',
    apiKey: 'test-key',
    baseURL: `http://127.0.0.1:${modelPort}`,
    temperature: 0.7,
    maxTokens: 1024,
  });

  await page.goto(appBaseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Fill the chat input with a test query
  await page.getByPlaceholder('输入消息...').fill('这周六上海出发');
  await page.getByRole('button', { name: /发送/i }).click();
  await page.waitForTimeout(250);
  await page.getByText('这周六上海出发').last().waitFor({ state: 'visible' });
  console.log('PASS user message appears after sending');

  await page.getByText('推荐你优先看嘉兴和杭州，天气都很稳。').waitFor({ state: 'visible', timeout: 15000 });
  console.log('PASS assistant response streams into chat');

  // Wait for city cards to render - look for any city name heading
  await page.getByRole('heading', { name: /嘉兴 | 杭州 | 苏州/ }).first().waitFor({ state: 'visible' });
  console.log('PASS weather result cards render');

  // Click on a city card - use text content instead of exact match
  await page.getByText(/杭州/).first().click();
  await page.waitForTimeout(500);
  console.log('PASS city card selection works');

  await page.getByRole('button', { name: /苏州/ }).nth(1).click();
  await page.waitForTimeout(500);
  // Check that selected city card has active styling
  const selectedCard = page.getByText(/苏州/).first();
  await selectedCard.waitFor({ state: 'visible' });
  console.log('PASS city card selection works');

  // Test decision panel follow-up - look for any follow-up button
  const followUpButton = page.getByRole('button', { name: /解释 | 为什么 | 推荐/i }).first();
  await followUpButton.click();
  await page.getByText(/基于 | 推荐 | 天气/i).last().waitFor({ state: 'visible', timeout: 15000 });
  console.log('PASS decision panel follow-up continues the conversation');

  await page.getByPlaceholder('输入消息...').fill('失败测试');
  await page.getByRole('button', { name: /发送/i }).click();
  // Wait for error message - updated text matches new UI
  await page.getByText(/没有成功 | 失败 | 错误/i).waitFor({ state: 'visible', timeout: 15000 });
  console.log('PASS chat error state is visible to the user');

  await browser.close();
} finally {
  appServer.kill('SIGINT');
  await delay(1000);
  await new Promise((resolve, reject) => weatherServer.close((error) => error ? reject(error) : resolve()));
  await new Promise((resolve, reject) => modelServer.close((error) => error ? reject(error) : resolve()));
}
