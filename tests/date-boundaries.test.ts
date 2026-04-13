import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDateQuery, formatDateDisplay } from '../lib/ai/date.ts';

// =============================================================================
// parseDateQuery 边界情况测试
// =============================================================================

const referenceDate = new Date('2026-04-09T12:00:00+08:00'); // Thursday

// --- 空输入和无效输入 ---

test('parseDateQuery handles empty string', () => {
  // Empty string should fall back to next Saturday
  const result = parseDateQuery('', referenceDate);
  assert.ok(result.match(/^\d{4}-\d{2}-\d{2}$/), 'Should return valid date format');
});

test('parseDateQuery handles whitespace-only input', () => {
  const result = parseDateQuery('   ', referenceDate);
  // Whitespace should fall back to next Saturday
  assert.ok(result.match(/^\d{4}-\d{2}-\d{2}$/), 'Should return valid date format');
});

test('parseDateQuery handles unknown phrases with fallback', () => {
  const result = parseDateQuery('不知道哪天', referenceDate);
  assert.ok(result.match(/^\d{4}-\d{2}-\d{2}$/), 'Should return valid date format for unknown input');
});

test('parseDateQuery handles null-like string "null"', () => {
  const result = parseDateQuery('null', referenceDate);
  assert.ok(result.match(/^\d{4}-\d{2}-\d{2}$/), 'Should handle "null" string gracefully');
});

// --- 边界日期值 ---

test('parseDateQuery handles 今天 correctly', () => {
  const result = parseDateQuery('今天', referenceDate);
  assert.equal(result, '2026-04-09', '今天 should be 2026-04-09');
});

test('parseDateQuery handles 大后天 (3 days ahead)', () => {
  const result = parseDateQuery('大后天', referenceDate);
  assert.equal(result, '2026-04-12', '大后天 should be 2026-04-12');
});

// --- 周几解析边界情况 ---

test('parseDateQuery 这周一 when today is Thursday returns next Monday', () => {
  const result = parseDateQuery('这周一', referenceDate);
  assert.equal(result, '2026-04-13', '这周一 from Thursday should be next Monday');
});

test('parseDateQuery 这周四 when today is Thursday returns today', () => {
  const result = parseDateQuery('这周四', referenceDate);
  assert.equal(result, '2026-04-09', '这周四 from Thursday should be today');
});

test('parseDateQuery 本周日 when today is Thursday returns this Sunday', () => {
  const result = parseDateQuery('本周日', referenceDate);
  assert.equal(result, '2026-04-12', '本周日 from Thursday should be this Sunday');
});

test('parseDateQuery 下周四 when today is Thursday returns next week', () => {
  const result = parseDateQuery('下周四', referenceDate);
  assert.equal(result, '2026-04-16', '下周四 from Thursday should be next week Thursday');
});

test('parseDateQuery 下周日 when today is Thursday returns next Sunday', () => {
  const result = parseDateQuery('下周日', referenceDate);
  assert.equal(result, '2026-04-19', '下周日 from Thursday should be next Sunday');
});

// --- 周末简写边界情况 ---

test('parseDateQuery 周六 when today is Saturday returns next Saturday', () => {
  const saturday = new Date('2026-04-11T12:00:00+08:00');
  const result = parseDateQuery('周六', saturday);
  assert.equal(result, '2026-04-18', '周六 on Saturday should be next Saturday');
});

test('parseDateQuery 周日 when today is Sunday returns next Sunday', () => {
  const sunday = new Date('2026-04-12T12:00:00+08:00');
  const result = parseDateQuery('周日', sunday);
  assert.equal(result, '2026-04-19', '周日 on Sunday should be next Sunday');
});

// --- 日期格式验证 ---

test('parseDateQuery passes through valid YYYY-MM-DD format', () => {
  assert.equal(parseDateQuery('2026-04-15', referenceDate), '2026-04-15');
  assert.equal(parseDateQuery('2026-12-31', referenceDate), '2026-12-31');
  assert.equal(parseDateQuery('2027-01-01', referenceDate), '2027-01-01');
});

test('parseDateQuery rejects invalid date formats', () => {
  // These should fall back to default (next Saturday)
  const result1 = parseDateQuery('2026/04/15', referenceDate);
  assert.ok(result1.match(/^\d{4}-\d{2}-\d{2}$/), 'Should return valid date format');
  
  const result2 = parseDateQuery('04-15-2026', referenceDate);
  assert.ok(result2.match(/^\d{4}-\d{2}-\d{2}$/), 'Should return valid date format');
});

test('parseDateQuery handles partial date strings', () => {
  const result = parseDateQuery('2026-04', referenceDate);
  assert.ok(result.match(/^\d{4}-\d{2}-\d{2}$/), 'Partial dates should fall back to default');
});

// --- 特殊日期边界 ---

test('parseDateQuery handles year boundary (late December)', () => {
  const lateDec = new Date('2026-12-30T12:00:00+08:00'); // Wednesday
  const result = parseDateQuery('下周六', lateDec);
  // 12/30 is Wed, next Saturday is 1/9/2027 (Wed + 7 days = Wed 1/6, then +3 = Sat 1/9)
  assert.ok(result.startsWith('2027-01'), 'Should handle year rollover correctly');
  const resultDate = new Date(result + 'T00:00:00');
  assert.equal(resultDate.getDay(), 6, 'Should return a Saturday');
});

test('parseDateQuery handles leap year date', () => {
  const leapYearDate = new Date('2024-02-28T12:00:00+08:00'); // Wednesday
  const result = parseDateQuery('明天', leapYearDate);
  assert.equal(result, '2024-02-29', 'Should handle leap year correctly');
});

// --- 默认回退行为 ---

test('parseDateQuery fallback returns a Saturday', () => {
  const result = parseDateQuery('random text', referenceDate);
  const resultDate = new Date(result + 'T00:00:00');
  assert.equal(resultDate.getDay(), 6, 'Fallback should return a Saturday');
});

test('parseDateQuery without referenceDate uses current date', () => {
  const result = parseDateQuery('今天');
  const today = new Date();
  const expected = today.toISOString().split('T')[0];
  assert.equal(result, expected, 'Should use current date when no reference provided');
});

// =============================================================================
// formatDateDisplay 测试
// =============================================================================

test('formatDateDisplay handles month boundary', () => {
  const jan1 = formatDateDisplay('2026-01-01');
  const dec31 = formatDateDisplay('2026-12-31');
  assert.ok(jan1.includes('1') && jan1.includes('月'), `Should include month: ${jan1}`);
  assert.ok(dec31.includes('12') && dec31.includes('月'), `Should include month: ${dec31}`);
});

test('formatDateDisplay handles single digit days correctly', () => {
  const apr1 = formatDateDisplay('2026-04-01');
  const apr9 = formatDateDisplay('2026-04-09');
  assert.ok(apr1.includes('4') && apr1.includes('月'), `Should include month: ${apr1}`);
  assert.ok(apr9.includes('4') && apr9.includes('月'), `Should include month: ${apr9}`);
});

test('formatDateDisplay shows correct weekday for all days', () => {
  assert.ok(formatDateDisplay('2026-04-05').includes('周日'), '4/5 should be Sunday');
  assert.ok(formatDateDisplay('2026-04-06').includes('周一'), '4/6 should be Monday');
  assert.ok(formatDateDisplay('2026-04-07').includes('周二'), '4/7 should be Tuesday');
  assert.ok(formatDateDisplay('2026-04-08').includes('周三'), '4/8 should be Wednesday');
  assert.ok(formatDateDisplay('2026-04-09').includes('周四'), '4/9 should be Thursday');
  assert.ok(formatDateDisplay('2026-04-10').includes('周五'), '4/10 should be Friday');
  assert.ok(formatDateDisplay('2026-04-11').includes('周六'), '4/11 should be Saturday');
});
