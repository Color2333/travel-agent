# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                  # start Next.js dev server (localhost:3000)
npm run build                # production build
npm run lint                 # ESLint via next lint

# TypeScript type-check (npx tsc is broken on Node v25 in this env)
node node_modules/typescript/bin/tsc --noEmit

# Tests
npm run test:unit            # Node built-in test runner, no server needed
npm run test:backend         # smoke test — boundary inputs, requires running server
npm run test:backend-success # happy-path test with mock weather service
npm run test:agent-provider  # AI provider connectivity test
```

Unit tests use Node's native `node:test` runner with `--experimental-strip-types`. No Jest/Vitest.

## Environment Variables

Two API keys required in `.env.local`:

```
OPENAI_API_KEY=<Zhipu AI key>
OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
WEATHER_API_KEY=<QWeather key>
WEATHER_API_HOST=<your-host>.re.qweatherapi.com
```

## Architecture

### Request Flow

```
User chat → POST /api/agent
  → streamText (AI SDK v6) with 3 tools, stopWhen: stepCountIs(5)
  → plan_trip tool called by AI
      → resolveOriginCity(name)          # local DB first, QWeather geo API fallback
      → resolveNearbyCities(lat, lng)    # QWeather coordinate search + static DB merge
      → fetchWeatherById per city        # parallel, with 1-hour in-memory cache
  → returns TripWeatherResult[] in stream
  → ChatContainer extracts cities from tool output → onWeatherUpdate()
  → CityCardGrid + MapInner re-render
```

### City Discovery Pipeline (`lib/cities/`)

Three files cooperate to find nearby cities from any Chinese origin:

1. **`lookup.ts`** — `resolveOriginCity(name)`: local `CITIES` DB → QWeather Geo API name lookup. `searchQWeatherNearbyCities(lat, lng, maxDistance)`: QWeather coordinate search (format: `?location={lng},{lat}`; longitude first). Returns cities with real QWeather IDs.

2. **`nearby.ts`** — `resolveNearbyCities(lat, lng, maxDistance, exclude)`: tries QWeather search (full city DB); falls back to static DB when <3 results; merges both for sparse regions.

3. **`utils.ts`** — `findNearbyFromCoords()` searches the 65-city static `CITIES` array using Haversine. `estimateTransitTimes(km)` returns `{trainTime, driveTime, trainPrice, drivePrice}` (HSR ~¥0.47/km, drive ~¥1.1/km).

### QWeather API Quirks

QWeather **always returns HTTP 200**, even for auth errors. Check `data.code !== '200'` before reading `data.daily` or `data.location`. The error format is `{"code": "401", "daily": null}` — not a standard error body.

Geo lookup coordinate format: `location={lng},{lat}` (longitude first, latitude second) — opposite of our internal `(lat, lng)` convention.

### Type System Note: Transport Data Through the Rendering Pipeline

`planTrip()` returns `TripWeatherResult` (extends `WeatherData` with `lat`, `lng`, `distance`, `trainTime`, `driveTime`, `trainPrice`, `drivePrice`, `province`). ChatContainer extracts this as `WeatherData[]` (TypeScript loses the extra fields). CityCardGrid recovers them via `WeatherDataWithTransport` (intersection type) and rebuilds a full `City` object to pass to `CityCard`. Don't break this chain — the transport section in CityCard only renders when `city.trainTime` is set.

### AI Date Parser (`lib/ai/date.ts`)

`parseDateQuery(query, referenceDate?)` supports: `今天`, `明天`, `后天`, `大后天`, `这周一`–`这周日`, `本周六/日`, `下周一`–`下周日`, `周六`, `周日`, plus `YYYY-MM-DD` passthrough. Unknown queries fall back to next Saturday. `forecastDateSchema` in `lib/validation.ts` only accepts today → today+6 days (QWeather 7-day forecast window).

### UI Style System (`lib/ui/`)

- `stage.ts` — CVA variants for the frosted-glass panel system (`stage.panelSurface`, `stage.subpanel`, etc.)
- `city-card.ts` — CVA variants for `CityCard` states (`cityCard.shell`, `cityCard.badge`)
- `cn.ts` — `clsx` + `tailwind-merge` helper

### ESM Import Convention

The project uses `"type": "module"`. Files under `lib/` import each other with explicit `.ts` extensions (e.g., `import { X } from './utils.ts'`). Next.js app files use the `@/*` path alias without extensions.

### Weather Scoring

`calculateScore()` in `lib/weather/api.ts` starts at 100 and applies penalties: rainy −50, snowy −40, overcast −20, cloudy −10; high humidity −5/−10/−15; precipitation; low visibility; large temp spread. Uses `nightWeather` when it's worse than daytime. Clamped to 0–100.
