import assert from 'node:assert/strict';
import { test } from 'node:test';
import { commitDay, defaultPlan, previewDay, startMission } from '../src/mission/dailyMission.ts';
import { createSave, parseSave } from '../src/mission/persistence.ts';

const shift = (assignments, choices = {}) => ({
  ...defaultPlan, ...choices, assignments: { ...defaultPlan.assignments, ...assignments },
});

test('inspection unlocks repair, a backup takes two shifts, and the repair adds power after its completion day', () => {
  const start = startMission('standard');
  assert.equal(commitDay(start, shift({ aya: 'repair' }), 1), undefined);
  const diagnosed = commitDay(start, shift({ aya: 'inspect' }), 1).next;
  assert.equal(diagnosed.controller, 'diagnosed');
  assert.equal(diagnosed.readiness.aya, 3);
  const repaired = commitDay(diagnosed, shift({ aya: 'repair' }), 2);
  const backup = commitDay(diagnosed, shift({ noah: 'repair' }), 2).next;
  assert.equal(backup.controller, 'partly-repaired');
  assert.equal(commitDay(backup, shift({ noah: 'repair' }, { location: 'shelter' }), 3), undefined);
  const cleared = { ...backup, completedDays: 4 };
  assert.equal(commitDay(cleared, shift({ noah: 'repair' }), 5).next.controller, 'repaired');
  assert.equal(repaired.generation, 8);
  assert.equal(previewDay(repaired.next, defaultPlan).generation, 7);
  assert.equal(previewDay(backup, defaultPlan).generation, 6);
});

test('specialist crop, recycler, safety and communications effects appear in the same committed projection', () => {
  const start = startMission('standard');
  const garden = commitDay(start, shift({ imani: 'grow' }), 1);
  assert.equal(garden.growth, 3);
  assert.equal(garden.next.readiness.imani, 3);
  assert.equal(commitDay(start, shift({ imani: 'grow' }, { lights: 'off' }), 1), undefined);
  const plan = shift({ mateo: 'recycle', leena: 'safety', noah: 'radio' }, { location: 'shelter' });
  const preview = previewDay(garden.next, plan);
  assert.deepEqual(commitDay(garden.next, plan, 2), preview);
  assert.equal(preview.recoveryPower, 0);
  assert.equal(preview.operations.forecastDays, 2);
  assert.equal(preview.next.readiness.mateo, 4);
  assert.equal(preview.next.readiness.noah, 4);
  assert.equal(preview.next.readiness.leena, 3);
  assert.equal(preview.next.readiness.imani, 4);
});

test('readiness, one operator per job, and particle restrictions govern commits', () => {
  const state = { ...startMission('standard'), completedDays: 2, readiness: { aya: 0, mateo: 4, imani: 4, leena: 4, noah: 4 } };
  const plan = shift({ aya: 'radio', imani: 'grow', leena: 'radio', noah: 'radio' }, { location: 'shelter' });
  const errors = previewDay(state, plan).operations.errors;
  assert.match(errors.aya, /needs 2 readiness/);
  assert.match(errors.imani, /outside work/);
  assert.match(errors.noah, /Only one person/);
  assert.equal(commitDay(state, plan, 3), undefined);
  assert.equal(commitDay(state, shift({}, { location: 'shelter' }), 3).next.readiness.aya, 2);
});

test('legacy saves restore with all crew rested and version two saves preserve actual assignments', () => {
  const current = { ...createSave('standard'), plans: [shift({ aya: 'inspect' })], reviewed: false };
  const replay = parseSave(JSON.stringify(current));
  assert.deepEqual(replay.history.map(report => report.day), [1]);
  assert.deepEqual(replay.history.at(-1), replay.last);
  assert.equal(replay.state.controller, 'diagnosed');
  assert.equal(replay.state.readiness.aya, 3);
  assert.deepEqual(replay.save.plans, current.plans);
  const { assignments, ...legacyPlan } = defaultPlan;
  const legacy = parseSave(JSON.stringify({ ...current, version: 1, plans: [legacyPlan] }));
  assert.equal(legacy.save.version, 2);
  assert.equal(legacy.state.controller, 'uninspected');
  assert.deepEqual(legacy.state.lastPlan.assignments, assignments);
  assert.equal(parseSave(JSON.stringify({ ...current, plans: [{ ...legacyPlan, assignments: { aya: 'inspect' } }] })), undefined);
});
