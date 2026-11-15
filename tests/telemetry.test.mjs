import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseHorizons } from '../src/server/telemetrySources.ts';

test('Horizons observer CSV converts AU to km and light time from minutes to seconds', () => {
  const observations = parseHorizons({ result: 'header\n$$SOE\n 2026-Nov-15 08:00, , , 30.06751, 0.00270223680017, -0.0209277, 0.02247382,\n$$EOE' });
  assert.equal(observations.illumination.value, 30.06751);
  assert.equal(observations.distance.time, '2026-11-15T08:00:00.000Z');
  assert.ok(Math.abs(observations.distance.value - 404249) < 2);
  assert.ok(Math.abs(observations.lightTime.value - 1.348) < .001);
  assert.deepEqual(parseHorizons({ error: 'Unavailable' }), {});
});
