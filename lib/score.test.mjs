import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rateSpot, tidePhaseAt, distanceKm, angleDiff } from './score.mjs';

const surf = { water: 'surf', access: 'land', beachFaces: 180 };
const entrance = { water: 'entrance', access: 'boat' };
const estuary = { water: 'estuary', access: 'land' };

test('distance Marlo to Orbost is about 13-17 km', () => {
  const d = distanceKm(-37.798, 148.533, -37.7, 148.45);
  assert.ok(d > 10 && d < 17, String(d));
});

test('angleDiff wraps around north', () => {
  assert.equal(angleDiff(350, 10), 20);
});

test('good surf day rates go', () => {
  const r = rateSpot(surf, { windKmh: 12, windFromDeg: 0, swellM: 1.0, tidePhase: 'rising', isLowLight: true });
  assert.equal(r.rating, 'go');
  assert.ok(r.reasons.some((x) => x.includes('Offshore')));
});

test('huge swell stops surf and entrance', () => {
  assert.equal(rateSpot(surf, { windKmh: 10, swellM: 3.2 }).rating, 'no');
  assert.equal(rateSpot(entrance, { windKmh: 10, swellM: 1.5 }).rating, 'no');
});

test('dangerous gusts stop everything', () => {
  assert.equal(rateSpot(estuary, { windKmh: 30, gustKmh: 55 }).rating, 'no');
});

test('tide phase from points', () => {
  const pts = [
    { time: '2026-11-08T00:00:00Z', height: 0.2 },
    { time: '2026-11-08T06:00:00Z', height: 1.4 },
    { time: '2026-11-08T12:00:00Z', height: 0.3 },
  ];
  assert.equal(tidePhaseAt(pts, '2026-11-08T03:00:00Z'), 'rising');
  assert.equal(tidePhaseAt(pts, '2026-11-08T09:00:00Z'), 'falling');
  assert.equal(tidePhaseAt(pts, '2026-11-09T09:00:00Z'), null);
});
