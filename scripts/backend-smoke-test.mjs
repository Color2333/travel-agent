import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 3011;
const baseUrl = `http://127.0.0.1:${port}`;

const checks = [
  {
    name: 'cities invalid maxDistance returns 400',
    path: '/api/cities?city=%E4%B8%8A%E6%B5%B7&maxDistance=abc',
    expectedStatus: 400,
  },
  {
    name: 'cities supported origin returns 200',
    path: '/api/cities?city=%E5%8C%97%E4%BA%AC',
    expectedStatus: 200,
  },
  {
    name: 'cities truly unknown origin returns 404',
    path: '/api/cities?city=%E7%81%AB%E6%98%9F',
    expectedStatus: 404,
  },
  {
    name: 'weather invalid date returns 400',
    path: '/api/weather?city=%E4%B8%8A%E6%B5%B7&date=2026-13-99',
    expectedStatus: 400,
  },
  {
    name: 'weather blank city returns 400',
    path: '/api/weather?city=%20%20%20&date=2026-04-10',
    expectedStatus: 400,
  },
  {
    name: 'agent malformed body returns 400',
    path: '/api/agent',
    method: 'POST',
    body: { foo: 'bar' },
    expectedStatus: 400,
  },
];

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/cities`);
      if (response.ok) return;
    } catch {
      // Server is not ready yet.
    }

    await delay(1000);
  }

  throw new Error('Timed out waiting for dev server');
}

async function runCheck(check) {
  const response = await fetch(`${baseUrl}${check.path}`, {
    method: check.method ?? 'GET',
    headers: check.body ? { 'Content-Type': 'application/json' } : undefined,
    body: check.body ? JSON.stringify(check.body) : undefined,
  });

  if (response.status !== check.expectedStatus) {
    const body = await response.text();
    throw new Error(`${check.name}: expected ${check.expectedStatus}, got ${response.status}, body=${body}`);
  }
}

const server = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

server.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
});

server.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
});

try {
  await waitForServer();

  for (const check of checks) {
    await runCheck(check);
    console.log(`PASS ${check.name}`);
  }
} finally {
  server.kill('SIGINT');
  await delay(1000);
}
