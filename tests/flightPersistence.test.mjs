import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startFlight } from '../src/mission/flightMission.ts';
import { flightSave, parseFlight, handoffFlight, campaignReceiptKey } from '../src/mission/flightPersistence.ts';
import { createSave, parseSave, saveKey } from '../src/mission/persistence.ts';
function storage(failAt = Infinity) {
  const data = new Map(); let writes = 0;
  return { data, getItem: key => data.get(key) ?? null, setItem(key, value) { if (++writes === failAt) throw new Error('interrupted'); data.set(key, value); } };
}
test('reject corrupt, unknown, oversized and unsupported journals', () => {
  const valid = flightSave(startFlight('flight'));
  for (const raw of ['null', '{}', '{', JSON.stringify({ ...valid, version: 2 }), JSON.stringify({ ...valid, rulesVersion: 2 }), JSON.stringify({ ...valid, runId: 12 }), JSON.stringify({ ...valid, actions: [{ id: '1', action: 'ignite' }] }), JSON.stringify({ ...valid, actions: Array(121).fill({ id: '1', action: 'start' }) }), JSON.stringify({ ...valid, actions: [{ id: NaN, action: 'start' }] })]) assert.equal(parseFlight(raw), undefined);
});
test('handoff recovers at each write boundary and returns same lunar run without replacing progress', () => {
  for (const failAt of [1, 2, 3, Infinity]) {
    const store = storage(failAt);
    try { handoffFlight(store, 'flight', null); } catch (error) { assert.equal(error.message, 'interrupted'); }
    const id = handoffFlight(store, 'flight', null);
    const raw = store.getItem(saveKey);
    assert.equal(parseSave(raw).save.runId, id);
    assert.equal(handoffFlight(store, 'flight', null), id);
    assert.equal(store.getItem(saveKey), raw);
    assert.equal(JSON.parse(store.getItem(campaignReceiptKey('flight'))).status, 'complete');
  }
});
test('interrupted or completed handoff never overwrites a newer lunar run', () => {
  for (const failAt of [2, Infinity]) {
    const store = storage(failAt);
    try { handoffFlight(store, 'flight', null); } catch {}
    const newer = JSON.stringify(createSave('lowPower')); store.data.set(saveKey, newer);
    assert.throws(() => handoffFlight(store, 'flight', null), /changed/);
    assert.equal(store.getItem(saveKey), newer);
  }
});
test('fresh handoff checks expected previous journal and storage failure is explicit', () => {
  const store = storage(); store.data.set(saveKey, JSON.stringify(createSave('standard')));
  assert.throws(() => handoffFlight(store, 'new', null), /changed/);
  assert.throws(() => handoffFlight(storage(1), 'new', null), /interrupted/);
});
test('legacy lunar v1 and v2 journals retain their independent resume paths', () => {
  const v2 = createSave('standard'); assert.ok(parseSave(JSON.stringify(v2)));
  const v1 = { ...v2, version: 1 }; assert.equal(parseSave(JSON.stringify(v1)).save.version, 2);
});

test('sampled NASA evidence has finite values, source units and chronological timestamps', async () => {
  const { readFile } = await import('node:fs/promises');
  const cabin = JSON.parse(await readFile(new URL('../src/data/flight-cabin.json', import.meta.url)));
  assert.equal(cabin.units, 'ppm'); assert.equal(cabin.samples.length, 12);
  assert.equal(cabin.samples[0].time, '2014-09-26 00:00:00');
  assert.equal(cabin.samples.at(-1).time, '2014-09-26 11:00:00');
  assert.ok(cabin.samples.every(s => Number.isFinite(s.co2) && s.co2 > 0));
  const route = JSON.parse(await readFile(new URL('../src/data/flight-artemis.json', import.meta.url)));
  assert.equal(route.frame, 'EME2000'); assert.equal(route.timeSystem, 'UTC'); assert.equal(route.center, 'EARTH');
  assert.equal(route.samples.length, 97);
  assert.ok(route.samples.every((s, i) => [s.x, s.y, s.z].every(Number.isFinite) && (!i || s.time > route.samples[i - 1].time)));
  assert.ok(route.samples[0].time < route.created && route.samples.at(-1).time > route.created);
});


test('later bypass retains the old flight receipt and cannot make that flight overwrite the newer outpost', () => {
  const store = storage();
  handoffFlight(store, 'old-flight', null);
  const old = store.getItem(saveKey);
  handoffFlight(store, 'new-bypass', old);
  const newer = store.getItem(saveKey);
  assert.throws(() => handoffFlight(store, 'old-flight', newer), /changed/);
  assert.equal(store.getItem(saveKey), newer);
});

test('flight replay retains the original outpost baseline across reloads', () => {
  const baseline = JSON.stringify(createSave('standard'));
  const flight = startFlight('flight', baseline);
  assert.equal(parseFlight(JSON.stringify(flightSave(flight))).lunarBaseline, baseline);
  const store = storage(); store.data.set(saveKey, JSON.stringify(createSave('lowPower')));
  assert.throws(() => handoffFlight(store, flight.runId, flight.lunarBaseline), /changed/);
});
