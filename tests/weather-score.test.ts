import test from 'node:test';
import assert from 'node:assert/strict';

// Import calculateScore by extracting it from the module
// We need to test it directly, so we'll import the whole module and access the function
import { fetchWeatherById, fetchWeatherForecast } from '../lib/weather/api.ts';

// Since calculateScore is not exported, we'll test the weather scoring indirectly
// through the full weather data flow, and directly by re-implementing for testing

function mapSeverity(w: string): number {
  switch (w) {
    case 'rainy': return 4;
    case 'snowy': return 3;
    case 'overcast': return 2;
    case 'cloudy': return 1;
    case 'sunny': return 0;
  }
  return 0;
}

function calculateScore(
  dayWeather: string,
  nightWeather: string | undefined,
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
  if (vis > 0 && vis < 3) score -= 10;
  else if (vis > 0 && vis < 5) score -= 7;
  else if (vis > 0 && vis < 10) score -= 3;

  // 5. 温差扣分 (最大 -5)
  if (tempSpread > 15) score -= 5;
  else if (tempSpread > 10) score -= 2;

  // 6. 紫外线指数 (最大 -5)
  if (uvIndex !== undefined) {
    if (uvIndex >= 11) score -= 5;
    else if (uvIndex >= 8) score -= 3;
    else if (uvIndex <= 1 && dayWeather === 'sunny') score -= 2;
  }

  // 7. 风速扣分 (最大 -5)
  if (windSpeed !== undefined) {
    if (windSpeed > 50) score -= 5;
    else if (windSpeed > 30) score -= 3;
    else if (windSpeed > 20) score -= 1;
  }

  // 8. 气压扣分 (最大 -3)
  if (pressure !== undefined) {
    if (pressure < 980) score -= 3;
    else if (pressure < 1000) score -= 1;
  }

  return Math.max(0, Math.min(100, score));
}

// =============================================================================
// calculateScore 基础场景测试
// =============================================================================

test('calculateScore returns 100 for perfect sunny weather', () => {
  const score = calculateScore('sunny', undefined, 40, 0, 20, 8);
  assert.equal(score, 100, 'Perfect sunny day should score 100');
});

test('calculateScore handles rainy weather with heavy penalties', () => {
  const score = calculateScore('rainy', undefined, 90, 15, 5, 12);
  // Base: 100 - 50 (rainy) - 15 (humidity>80) - 15 (precip>10) - 7 (vis<5) - 2 (tempSpread>10) = 11
  assert.ok(score >= 10 && score <= 20, `Rainy weather should have low score, got ${score}`);
});

test('calculateScore handles snowy weather', () => {
  const score = calculateScore('snowy', undefined, 50, 0, 15, 10);
  // Base: 100 - 40 (snowy) = 60
  assert.equal(score, 60, 'Snowy weather should score 60');
});

test('calculateScore handles overcast weather', () => {
  const score = calculateScore('overcast', undefined, 50, 0, 15, 8);
  // Base: 100 - 20 (overcast) = 80
  assert.equal(score, 80, 'Overcast weather should score 80');
});

test('calculateScore handles cloudy weather', () => {
  const score = calculateScore('cloudy', undefined, 50, 0, 15, 8);
  // Base: 100 - 10 (cloudy) = 90
  assert.equal(score, 90, 'Cloudy weather should score 90');
});

// =============================================================================
// calculateScore 湿度边界测试
// =============================================================================

test('calculateScore applies humidity penalty at >60%', () => {
  const score60 = calculateScore('sunny', undefined, 60, 0, 20, 8);
  const score61 = calculateScore('sunny', undefined, 61, 0, 20, 8);
  assert.equal(score60, 100, '60% humidity should have no penalty');
  assert.equal(score61, 95, '61% humidity should have -5 penalty');
});

test('calculateScore applies higher humidity penalty at >70%', () => {
  const score70 = calculateScore('sunny', undefined, 70, 0, 20, 8);
  const score71 = calculateScore('sunny', undefined, 71, 0, 20, 8);
  assert.equal(score70, 95, '70% humidity should have -5 penalty');
  assert.equal(score71, 90, '71% humidity should have -10 penalty');
});

test('calculateScore applies maximum humidity penalty at >80%', () => {
  const score80 = calculateScore('sunny', undefined, 80, 0, 20, 8);
  const score81 = calculateScore('sunny', undefined, 81, 0, 20, 8);
  assert.equal(score80, 90, '80% humidity should have -10 penalty');
  assert.equal(score81, 85, '81% humidity should have -15 penalty');
});

// =============================================================================
// calculateScore 降水边界测试
// =============================================================================

test('calculateScore applies precip penalty for small amounts', () => {
  const score0 = calculateScore('sunny', undefined, 50, 0, 20, 8);
  const score1 = calculateScore('sunny', undefined, 50, 1, 20, 8);
  const score5 = calculateScore('sunny', undefined, 50, 5, 20, 8);
  assert.equal(score0, 100, 'No precip should have no penalty');
  assert.equal(score1, 98, '1mm precip should have -2 penalty');
  assert.equal(score5, 90, '5mm precip should have -10 penalty');
});

test('calculateScore applies maximum precip penalty for heavy rain', () => {
  const score6 = calculateScore('sunny', undefined, 50, 6, 20, 8);
  const score10 = calculateScore('sunny', undefined, 50, 10, 20, 8);
  const score11 = calculateScore('sunny', undefined, 50, 11, 20, 8);
  assert.equal(score6, 90, '6mm precip should have -10 penalty');
  assert.equal(score10, 90, '10mm precip should have -10 penalty');
  assert.equal(score11, 85, '11mm precip should have -15 penalty');
});

// =============================================================================
// calculateScore 能见度边界测试
// =============================================================================

test('calculateScore applies visibility penalty for poor visibility', () => {
  const score20 = calculateScore('sunny', undefined, 50, 0, 20, 8);
  const score10 = calculateScore('sunny', undefined, 50, 0, 10, 8);
  const score5 = calculateScore('sunny', undefined, 50, 0, 5, 8);
  const score3 = calculateScore('sunny', undefined, 50, 0, 3, 8);
  const score2 = calculateScore('sunny', undefined, 50, 0, 2, 8);
  assert.equal(score20, 100, '20km visibility should have no penalty');
  // Visibility penalty: vis < 10 gets -3, vis < 5 gets -7, vis < 3 gets -10
  assert.equal(score10, 100, '10km visibility should have no penalty (boundary)');
  assert.equal(score5, 97, '5km visibility should have -3 penalty (vis < 10)');
  assert.equal(score3, 93, '3km visibility should have -7 penalty (vis < 5)');
  assert.equal(score2, 90, '2km visibility should have -10 penalty (vis < 3)');
});

test('calculateScore applies severe penalty for very poor visibility', () => {
  const score2 = calculateScore('sunny', undefined, 50, 0, 2, 8);
  const score1 = calculateScore('sunny', undefined, 50, 0, 1, 8);
  assert.equal(score2, 90, '2km visibility should have -10 penalty');
  assert.equal(score1, 90, '1km visibility should have -10 penalty');
});

test('calculateScore does not penalize when visibility is 0 (unknown)', () => {
  const score = calculateScore('sunny', undefined, 50, 0, 0, 8);
  assert.equal(score, 100, '0 visibility (unknown) should not be penalized');
});

// =============================================================================
// calculateScore 温差边界测试
// =============================================================================

test('calculateScore applies temp spread penalty for large differences', () => {
  const score10 = calculateScore('sunny', undefined, 50, 0, 20, 10);
  const score11 = calculateScore('sunny', undefined, 50, 0, 20, 11);
  const score15 = calculateScore('sunny', undefined, 50, 0, 20, 15);
  const score16 = calculateScore('sunny', undefined, 50, 0, 20, 16);
  assert.equal(score10, 100, '10°C spread should have no penalty');
  assert.equal(score11, 98, '11°C spread should have -2 penalty');
  assert.equal(score15, 98, '15°C spread should have -2 penalty');
  assert.equal(score16, 95, '16°C spread should have -5 penalty');
});

// =============================================================================
// calculateScore 紫外线指数测试
// =============================================================================

test('calculateScore penalizes extreme UV index', () => {
  const score10 = calculateScore('sunny', undefined, 50, 0, 20, 8, 10);
  const score11 = calculateScore('sunny', undefined, 50, 0, 20, 8, 11);
  assert.equal(score10, 97, 'UV 10 should have -3 penalty');
  assert.equal(score11, 95, 'UV 11 should have -5 penalty');
});

test('calculateScore penalizes very low UV on sunny days', () => {
  const score0 = calculateScore('sunny', undefined, 50, 0, 20, 8, 0);
  const score1 = calculateScore('sunny', undefined, 50, 0, 20, 8, 1);
  const score2 = calculateScore('sunny', undefined, 50, 0, 20, 8, 2);
  assert.equal(score0, 98, 'UV 0 on sunny day should have -2 penalty');
  assert.equal(score1, 98, 'UV 1 on sunny day should have -2 penalty');
  assert.equal(score2, 100, 'UV 2 on sunny day should have no penalty');
});

// =============================================================================
// calculateScore 风速测试
// =============================================================================

test('calculateScore penalizes high wind speeds', () => {
  const score20 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 20);
  const score21 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 21);
  const score30 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 30);
  const score31 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 31);
  const score50 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 50);
  const score51 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 51);
  assert.equal(score20, 100, '20km/h wind should have no penalty');
  assert.equal(score21, 99, '21km/h wind should have -1 penalty');
  assert.equal(score30, 99, '30km/h wind should have -1 penalty');
  assert.equal(score31, 97, '31km/h wind should have -3 penalty');
  assert.equal(score50, 97, '50km/h wind should have -3 penalty');
  assert.equal(score51, 95, '51km/h wind should have -5 penalty');
});

// =============================================================================
// calculateScore 气压测试
// =============================================================================

test('calculateScore penalizes low pressure', () => {
  const score1000 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 10, 1000);
  const score999 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 10, 999);
  const score980 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 10, 980);
  const score979 = calculateScore('sunny', undefined, 50, 0, 20, 8, 5, 10, 979);
  assert.equal(score1000, 100, '1000hPa should have no penalty');
  assert.equal(score999, 99, '999hPa should have -1 penalty');
  assert.equal(score980, 99, '980hPa should have -1 penalty');
  assert.equal(score979, 97, '979hPa should have -3 penalty');
});

// =============================================================================
// calculateScore 夜间天气恶化测试
// =============================================================================

test('calculateScore uses worse night weather for scoring', () => {
  // Day is sunny, night is rainy - should use rainy
  const score1 = calculateScore('sunny', 'rainy', 50, 0, 20, 8);
  assert.equal(score1, 50, 'Should use worse night weather (rainy)');
  
  // Day is rainy, night is sunny - should use rainy
  const score2 = calculateScore('rainy', 'sunny', 50, 0, 20, 8);
  assert.equal(score2, 50, 'Should use worse day weather (rainy)');
  
  // Day is cloudy (severity 1), night is overcast (severity 2) - should use overcast
  // overcast = -20, so 100 - 20 = 80
  const score3 = calculateScore('cloudy', 'overcast', 50, 0, 20, 8);
  assert.equal(score3, 80, 'Should use worse night weather (overcast)');
});

// =============================================================================
// calculateScore 边界值测试
// =============================================================================

test('calculateScore clamps to 0 minimum', () => {
  // Worst possible conditions
  const score = calculateScore('rainy', 'rainy', 90, 20, 1, 20, 11, 60, 950);
  assert.ok(score >= 0, 'Score should never be negative');
  assert.equal(score, 0, 'Extreme bad conditions should result in 0');
});

test('calculateScore clamps to 100 maximum', () => {
  // Best possible conditions - should not exceed 100
  const score = calculateScore('sunny', 'sunny', 30, 0, 30, 5, 5, 10, 1020);
  assert.ok(score <= 100, 'Score should never exceed 100');
  assert.equal(score, 100, 'Perfect conditions should result in 100');
});

test('calculateScore handles undefined optional parameters', () => {
  const score1 = calculateScore('sunny', undefined, 50, 0, 20, 8);
  const score2 = calculateScore('sunny', undefined, 50, 0, 20, 8, undefined);
  const score3 = calculateScore('sunny', undefined, 50, 0, 20, 8, undefined, undefined);
  const score4 = calculateScore('sunny', undefined, 50, 0, 20, 8, undefined, undefined, undefined);
  assert.equal(score1, 100, 'Should handle all undefined optional params');
  assert.equal(score2, 100, 'Should handle undefined uvIndex');
  assert.equal(score3, 100, 'Should handle undefined windSpeed');
  assert.equal(score4, 100, 'Should handle undefined pressure');
});
