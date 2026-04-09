import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const modelPort = 4021;
const appPort = 3013;
const appBaseUrl = `http://127.0.0.1:${appPort}`;

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
    const providerLabel = payload.model.includes('mock-openai') ? 'openai' : 'zhipu';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    res.write(`data: ${JSON.stringify({
      id: 'chatcmpl-mock',
      object: 'chat.completion.chunk',
      created: 1,
      model: payload.model,
      choices: [{ index: 0, delta: { role: 'assistant', content: `${providerLabel}:` }, finish_reason: null }],
    })}\n\n`);
    res.write(`data: ${JSON.stringify({
      id: 'chatcmpl-mock',
      object: 'chat.completion.chunk',
      created: 1,
      model: payload.model,
      choices: [{ index: 0, delta: { content: 'provider-ok' }, finish_reason: null }],
    })}\n\n`);
    res.write(`data: ${JSON.stringify({
      id: 'chatcmpl-mock',
      object: 'chat.completion.chunk',
      created: 1,
      model: payload.model,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    })}\n\n`);
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

async function assertAgentResponse(body, expectedParts) {
  const response = await fetch(`${appBaseUrl}/api/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const hasAllParts = expectedParts.every((part) => text.includes(part));
  if (response.status !== 200 || !hasAllParts) {
    throw new Error(`expected agent response to include ${expectedParts.join(', ')}, got status=${response.status}, body=${text}`);
  }
}

const modelServer = createModelServer();
await new Promise((resolve) => modelServer.listen(modelPort, '127.0.0.1', resolve));

const appServer = spawn('npm', ['run', 'dev', '--', '--port', String(appPort)], {
  env: {
    ...process.env,
    OPENAI_API_KEY: 'test-key',
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

  await assertAgentResponse({
    messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: '你好' }] }],
    provider: 'zhipu',
    model: 'mock-zhipu',
    baseURL: `http://127.0.0.1:${modelPort}`,
    apiKey: 'test-key',
  }, ['zhipu:', 'provider-ok']);
  console.log('PASS agent zhipu provider path');

  await assertAgentResponse({
    messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: '你好' }] }],
    provider: 'openai',
    model: 'mock-openai',
    baseURL: `http://127.0.0.1:${modelPort}`,
    apiKey: 'test-key',
  }, ['openai:', 'provider-ok']);
  console.log('PASS agent openai provider path');
} finally {
  appServer.kill('SIGINT');
  await delay(1000);
  await new Promise((resolve, reject) => modelServer.close((error) => error ? reject(error) : resolve()));
}
