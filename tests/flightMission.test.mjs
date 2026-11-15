import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startFlight, legalActions, commitFlight, previewFlight, canReachLanding } from '../src/mission/flightMission.ts';
import { flightSave, parseFlight, retryCheckpoint } from '../src/mission/flightPersistence.ts';

function action(state, name) {
  const next = commitFlight(state, { id: String(state.actionJournal.length), action: name });
  assert.ok(next, `${state.phase}: ${name}`);
  assert.deepEqual(parseFlight(JSON.stringify(flightSave(next))), next, `restore ${name}`);
  return next;
}
function settle(s) { return s.pendingReport ? action(s, 'acknowledge') : s; }
export function journey(engine = 'cool', oxygen = 'repair', stop = 'outpost') {
  let s = startFlight('test-flight');
  while (s.phase !== stop) {
    const available = legalActions(s);
    const chosen = available.includes(engine) ? engine : available.includes(oxygen) ? oxygen : available[0];
    assert.ok(chosen);
    s = action(s, chosen);
  }
  return s;
}
test('all four recovery routes land within budget and replay after every action', () => {
  for (const engine of ['cool', 'thrusters']) for (const oxygen of ['repair', 'bypass']) {
    const s = journey(engine, oxygen);
    assert.equal(s.outcome, 'landed');
    assert.ok(s.resources.fuel >= 1 && s.resources.fuel <= 3);
    assert.ok(s.resources.battery >= 5 && s.resources.battery <= 9);
    assert.ok(s.resources.oxygen >= 6 && s.resources.oxygen <= 9);
    assert.equal(s.reports.filter(r => ['cool', 'thrusters', 'repair', 'bypass'].includes(r.action)).length, 2);
  }
});
test('startup prerequisites, navigation fault and clearance cannot be skipped', () => {
  let s = startFlight('checks');
  for (const name of ['ignite', 'go', 'confirm', 'life', 'finish', 'unknown']) assert.equal(commitFlight(s, { id: name, action: name }), undefined);
  for (const name of ['start', 'ground', 'avionics']) s = settle(action(s, name));
  assert.deepEqual(legalActions(s), ['life', 'align']);
  for (const name of ['align', 'route', 'confirm']) s = settle(action(s, name));
  assert.equal(s.phase, 'startup');
  s = settle(action(s, 'life'));
  assert.equal(s.phase, 'clearance');
  assert.deepEqual(legalActions(s), ['onboard']);
  s = settle(action(s, 'onboard')); s = settle(action(s, 'go'));
  assert.deepEqual(legalActions(s), ['authorize']);
  s = action(s, 'authorize');
  assert.deepEqual(s.resources, { fuel: 18, battery: 16, oxygen: 16 });
  assert.deepEqual(legalActions(s), ['ignite']);
});
test('duplicate commits, pending reports and out-of-order actions cannot spend twice', () => {
  let s = journey('cool', 'repair', 'earthOrbit');
  const preview = previewFlight(s, 'depart'); assert.equal(preview.allowed, true);
  const entry = { id: 'departure', action: 'depart' };
  const next = commitFlight(s, entry);
  assert.deepEqual(next.resources, preview.next.resources);
  assert.equal(commitFlight(next, entry), undefined);
  assert.equal(commitFlight(next, { id: 'again', action: 'depart' }), undefined);
  s = journey('cool', 'repair', 'coast');
  assert.ok(s.pendingReport);
  assert.equal(commitFlight(s, { id: 'skip-report', action: 'coast' }), undefined);
});
test('reserve evaluation considers compatible complete routes and oxygen strictly positive', () => {
  const s = journey('cool', 'repair', 'engineIncident');
  const inspected = action(s, 'inspect');
  const tight = { ...inspected, resources: { fuel: 7, battery: 9, oxygen: 7 } };
  assert.equal(previewFlight(tight, 'cool').allowed, true);
  assert.equal(previewFlight(tight, 'thrusters').allowed, false);
  for (const oxygen of [0, -1, NaN, Infinity]) assert.equal(canReachLanding({ ...s, resources: { ...s.resources, oxygen } }), false);
});
test('checkpoint retry removes the incident and later costs, without duplicating reports', () => {
  const s = journey();
  const checkpoint = retryCheckpoint(s);
  assert.equal(checkpoint.phase, 'oxygenIncident');
  assert.equal(checkpoint.reports.filter(r => ['repair', 'bypass'].includes(r.action)).length, 0);
  assert.deepEqual(parseFlight(JSON.stringify(flightSave(checkpoint))), checkpoint);
});

test('a saved touchdown can enter the outpost directly and keeps the flight journal replayable', async () => {
  const { completeLanding } = await import('../src/mission/flightMission.ts');
  const beforeTouchdown = journey('cool', 'repair', 'touchdown');
  assert.equal(completeLanding(beforeTouchdown), undefined);
  const touchdown = journey('cool', 'repair', 'debrief');
  const completed = completeLanding(touchdown);
  assert.equal(completed.phase, 'outpost');
  assert.deepEqual(completed.resources, touchdown.resources);
  assert.deepEqual(completed.actionJournal.slice(-2).map(entry => entry.action), ['report', 'finish']);
  assert.deepEqual(parseFlight(JSON.stringify(flightSave(completed))), completed);
  assert.equal(completeLanding(completed), completed);
  const reported = action(touchdown, 'report');
  assert.equal(completeLanding(reported).actionJournal.length, reported.actionJournal.length + 1);
});
