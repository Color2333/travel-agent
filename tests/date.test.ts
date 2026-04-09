import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateDisplay, parseDateQuery } from '../lib/ai/date.ts';

const referenceDate = new Date('2026-04-09T12:00:00+08:00');

test('parseDateQuery keeps local calendar date for tomorrow in UTC+8', () => {
  assert.equal(parseDateQuery('明天', referenceDate), '2026-04-10');
});

test('parseDateQuery resolves weekend phrases correctly', () => {
  assert.equal(parseDateQuery('这周六', referenceDate), '2026-04-11');
  assert.equal(parseDateQuery('这周日', referenceDate), '2026-04-12');
  assert.equal(parseDateQuery('下周六', referenceDate), '2026-04-18');
  assert.equal(parseDateQuery('下周日', referenceDate), '2026-04-19');
});

test('parseDateQuery passes through explicit date strings', () => {
  assert.equal(parseDateQuery('2026-04-15', referenceDate), '2026-04-15');
});

test('parseDateQuery falls back to this weekend for unknown phrases', () => {
  assert.equal(parseDateQuery('随便哪天', referenceDate), '2026-04-11');
});

test('formatDateDisplay renders the expected Chinese label', () => {
  assert.equal(formatDateDisplay('2026-04-12'), '4月12日 周日');
});
