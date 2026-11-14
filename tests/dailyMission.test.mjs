import assert from 'node:assert/strict';
import { test } from 'node:test';
import { commitDay, defaultPlan, lunarTraining, previewDay, startMission } from '../src/mission/dailyMission.ts';
import { createSave, parseSave } from '../src/mission/persistence.ts';

function trainingPlan(day, lights, airMode = 'normal') {
  return { ...defaultPlan, lights, airMode, location: day === 3 || day === 4 ? 'shelter' : 'habitat' };
}

test('both Lunar strategies finish ready, with identical preview and committed results', () => {
  const strategies = [
    { scenario: 'standard', lights: ['low', 'low', 'low', 'low', 'low', 'low', 'off'], harvestDay: 6 },
    { scenario: 'lowPower', lights: ['full', 'full', 'off', 'off', 'full', 'off', 'off'], harvestDay: 5 },
  ];
  for (const strategy of strategies) {
    let state = startMission(strategy.scenario);
    const campaign = createSave(strategy.scenario);
    for (let day = 1; day <= lunarTraining.days; day++) {
      const airMode = strategy.scenario === 'lowPower' && day === 3 ? 'reserve' : 'normal';
      const plan = trainingPlan(day, strategy.lights[day - 1], airMode);
      const preview = previewDay(state, plan);
      const result = commitDay(state, plan, day);
      assert.deepEqual(result, preview);
      assert.equal(result.harvest, day === strategy.harvestDay ? lunarTraining.harvestFood : 0);
      assert.equal(result.next.food, state.food - lunarTraining.foodPerDay + result.harvest);
      assert.equal(state.completedDays, day - 1);
      state = result.next;
      campaign.plans.push(plan);
      assert.equal(commitDay(state, plan, day), undefined);
      assert.deepEqual(parseSave(JSON.stringify(campaign)).state, state);
    }
    assert.equal(state.outcome, 'ready');
    assert.equal(commitDay(state, defaultPlan, 8), undefined);
  }
});

test('storm exposure and an inadequate reserve can interrupt the same turn', () => {
  const state = { ...startMission('standard'), completedDays: 3, air: 1 };
  const plan = { ...defaultPlan, airMode: 'reserve' };
  const result = commitDay(state, plan, 4);
  assert.equal(result.phase, 'peak');
  assert.deepEqual(result.hazards, ['exposure', 'air']);
  assert.equal(result.next.outcome, 'interrupted');
  assert.equal(result.next.air, 0);
});

test('early critical power shortages survive later charging and battery capacity applies during charging', () => {
  const start = startMission('standard');
  const empty = commitDay({ ...start, battery: 0 }, defaultPlan, 1);
  assert.deepEqual(empty.hazards, ['power']);
  assert.ok(empty.next.battery > 0);
  assert.equal(empty.next.outcome, 'interrupted');

  const full = commitDay({ ...start, battery: lunarTraining.capacity.battery }, defaultPlan, 1);
  assert.equal(full.lostGeneration, 4);
  assert.equal(full.next.battery, lunarTraining.capacity.battery - 2);
});

test('recovery is bounded by wastewater and is too late for a morning drinking shortage', () => {
  const state = { ...startMission('standard'), completedDays: 1, water: 0, wastewater: 1, crop: 5 };
  const result = commitDay(state, defaultPlan, 2);
  assert.equal(result.recovered, 1);
  assert.equal(result.next.wastewater, 0);
  assert.equal(result.harvest, 0);
  assert.deepEqual(result.hazards, ['water']);
});

test('starting meals are consumed before harvesting, and survival and readiness can diverge', () => {
  const state = { ...startMission('standard'), completedDays: 6, food: 2 };
  const result = commitDay(state, defaultPlan, 7);
  assert.equal(result.next.outcome, 'shortfall');
  assert.deepEqual(result.hazards, []);
  const lateHarvest = commitDay({ ...state, food: 1, crop: 5 }, defaultPlan, 7);
  assert.equal(lateHarvest.harvest, 0);
  assert.deepEqual(lateHarvest.hazards, ['food']);
});

test('save validation restores unread reports and rejects invalid data or extra turns after failure', () => {
  const save = { ...createSave('standard'), reviewed: false, plans: [defaultPlan, defaultPlan, defaultPlan] };
  const restored = parseSave(JSON.stringify(save));
  assert.equal(restored.save.reviewed, false);
  assert.equal(restored.last.phase, 'rising');
  assert.equal(restored.state.outcome, 'interrupted');
  for (const invalid of [
    '{',
    JSON.stringify({ ...save, version: 0 }),
    JSON.stringify({ ...save, plans: [] }),
    JSON.stringify({ ...save, plans: [...save.plans, defaultPlan] }),
    JSON.stringify({ ...save, plans: [{ ...defaultPlan, lights: 'toString' }] }),
    JSON.stringify({ ...save, plans: [{ ...defaultPlan, recovery: false }] }),
  ]) {
    assert.equal(parseSave(invalid), undefined);
  }
});
