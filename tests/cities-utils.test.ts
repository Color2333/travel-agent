import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistance, estimateTransitTimes, findNearbyFromCoords } from '../lib/cities/utils.ts';

// =============================================================================
// haversineDistance 测试
// =============================================================================

test('haversineDistance returns 0 for identical coordinates', () => {
  assert.equal(haversineDistance(39.9042, 116.4074, 39.9042, 116.4074), 0);
});

test('haversineDistance calculates correct distance between Beijing and Shanghai', () => {
  // Beijing: 39.9042, 116.4074; Shanghai: 31.2304, 121.4737
  // Expected distance is approximately 1068 km
  const distance = haversineDistance(39.9042, 116.4074, 31.2304, 121.4737);
  assert.ok(distance > 1060 && distance < 1080, `Expected ~1068km, got ${distance}`);
});

test('haversineDistance handles short distances accurately', () => {
  // Suzhou to Wuxi: very close cities
  // Suzhou: 31.2989, 120.5853; Wuxi: 31.4912, 120.3119
  const distance = haversineDistance(31.2989, 120.5853, 31.4912, 120.3119);
  assert.ok(distance > 25 && distance < 35, `Expected ~30km, got ${distance}`);
});

test('haversineDistance handles extreme latitude values', () => {
  // Test near the poles
  const distanceNorth = haversineDistance(89.9, 0, 89.9, 180);
  assert.ok(distanceNorth > 0, 'Should handle near-north-pole coordinates');
  
  // Test crossing equator
  const distanceEquator = haversineDistance(1, 0, -1, 0);
  assert.ok(distanceEquator > 200 && distanceEquator < 250, `Expected ~222km, got ${distanceEquator}`);
});

test('haversineDistance handles negative coordinates (southern/western hemisphere)', () => {
  // Test with negative lat/lng values
  const distance = haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631);
  // Sydney to Melbourne approximate distance
  assert.ok(distance > 700 && distance < 750, `Expected ~714km, got ${distance}`);
});

test('haversineDistance is symmetric (order does not matter)', () => {
  const d1 = haversineDistance(39.9042, 116.4074, 31.2304, 121.4737);
  const d2 = haversineDistance(31.2304, 121.4737, 39.9042, 116.4074);
  assert.equal(d1, d2, 'Distance should be the same regardless of order');
});

// =============================================================================
// estimateTransitTimes 测试
// =============================================================================

test('estimateTransitTimes returns reasonable values for short distance', () => {
  const result = estimateTransitTimes(50);
  assert.ok(result.trainTime.includes('分钟') || result.trainTime.includes('小时'), 'Should have train time');
  assert.ok(result.driveTime.includes('分钟') || result.driveTime.includes('小时'), 'Should have drive time');
  assert.ok(result.trainPrice.includes('¥'), 'Should have train price');
  assert.ok(result.drivePrice.includes('¥'), 'Should have drive price');
});

test('estimateTransitTimes handles zero distance', () => {
  const result = estimateTransitTimes(0);
  assert.equal(result.trainTime, '0 分钟', 'Zero distance should give 0 minutes train time');
  assert.equal(result.driveTime, '0 分钟', 'Zero distance should give 0 minutes drive time');
  assert.equal(result.trainPrice, '约¥0', 'Zero distance should give ¥0 train price');
  assert.equal(result.drivePrice, '约¥0', 'Zero distance should give ¥0 drive price');
});

test('estimateTransitTimes handles very long distances', () => {
  const result = estimateTransitTimes(2000);
  // HSR: 2000/300 + 0.25 = ~6.92 hours
  assert.ok(result.trainTime.includes('小时'), 'Long distance should show hours');
  // Drive: 2000/80 = 25 hours
  assert.ok(result.driveTime.includes('小时'), 'Long distance should show hours');
});

test('estimateTransitTimes price calculation matches expected rates', () => {
  // HSR: ~0.47 yuan/km, rounded to nearest 5
  // Drive: ~1.1 yuan/km, rounded to nearest 10
  
  const result100 = estimateTransitTimes(100);
  // Train: 100 * 0.47 = 47, rounded to 45 or 50
  assert.ok(result100.trainPrice === '约¥45' || result100.trainPrice === '约¥50', 
    `Expected ~¥45-50 for 100km, got ${result100.trainPrice}`);
  // Drive: 100 * 1.1 = 110, rounded to 110
  assert.ok(result100.drivePrice === '约¥110', `Expected ~¥110 for 100km, got ${result100.drivePrice}`);
});

test('estimateTransitTimes handles boundary distance values', () => {
  // Test very small distance
  const result1 = estimateTransitTimes(1);
  assert.ok(result1.trainTime.includes('分钟'), '1km should show minutes');
  
  // Test large distance
  const result5000 = estimateTransitTimes(5000);
  assert.ok(result5000.trainTime.includes('小时'), '5000km should show hours');
  assert.ok(parseInt(result5000.trainPrice.replace(/[^0-9]/g, '')) > 2000, '5000km train price should be > 2000');
});

// =============================================================================
// findNearbyFromCoords 测试
// =============================================================================

test('findNearbyFromCoords finds cities near Shanghai', () => {
  // Shanghai: 31.2304, 121.4737
  const cities = findNearbyFromCoords(31.2304, 121.4737, 100);
  assert.ok(cities.length > 0, 'Should find cities near Shanghai');
  assert.ok(cities.every(c => c.distance !== undefined && c.distance <= 100), 
    'All cities should be within 100km');
});

test('findNearbyFromCoords excludes the origin city by name', () => {
  const cities = findNearbyFromCoords(31.2304, 121.4737, 100, '上海');
  assert.ok(!cities.some(c => c.name === '上海'), 'Should exclude Shanghai when specified');
});

test('findNearbyFromCoords returns limited results for very small radius', () => {
  // Small radius may still include some nearby cities
  const cities = findNearbyFromCoords(31.2304, 121.4737, 5);
  // Just verify the function works correctly with small radius
  assert.ok(Array.isArray(cities), 'Should return an array');
  assert.ok(cities.every(c => c.distance !== undefined), 'All cities should have distance');
});

test('findNearbyFromCoords results are sorted by distance', () => {
  const cities = findNearbyFromCoords(31.2304, 121.4737, 200);
  for (let i = 1; i < cities.length; i++) {
    assert.ok(cities[i].distance! >= cities[i - 1].distance!, 
      'Cities should be sorted by distance ascending');
  }
});

test('findNearbyFromCoords includes transport estimates for each city', () => {
  const cities = findNearbyFromCoords(31.2304, 121.4737, 100);
  for (const city of cities) {
    assert.ok(city.trainTime !== undefined, 'Should have train time');
    assert.ok(city.driveTime !== undefined, 'Should have drive time');
    assert.ok(city.trainPrice !== undefined, 'Should have train price');
    assert.ok(city.drivePrice !== undefined, 'Should have drive price');
  }
});
