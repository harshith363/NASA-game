import assert from 'node:assert/strict';
import test from 'node:test';
import { commitShift, defaultPlan, harvestTarget, projectShift, recover, startMission } from '../src/mission/solarStorm.ts';

const sheltered = (lights = 'dim', airMode = 'normal') => ({ ...defaultPlan, lights, airMode });

function run(plans, scenario) {
  let state = startMission(scenario);
  for (const plan of plans) {
    const expected = projectShift(state, plan);
    const step = commitShift(state, plan);
    assert.ok(step, 'Shift is playable');
    assert.deepEqual(step.result, expected);
    for (const key of ['battery', 'air', 'harvest']) assert.equal(step.next[key], expected[key]);
    state = step.next;
  }
  return state;
}

test('default and farm-off plans keep the crew safe but miss tomorrow’s harvest', () => {
  for (const [light, harvest, battery] of [['dim', 2, 2], ['off', 0, 4]]) {
    const state = run([sheltered(light), sheltered(light)]);
    assert.equal(state.outcome, 'delayed');
    assert.equal(state.harvest, harvest);
    assert.equal(state.battery, battery);
    assert.equal(state.air, 3);
    assert.equal(recover(state).phase, 'recovery');
  }
});

test('normal-air and early reserve strategies can both meet the full objective', () => {
  for (const airMode of ['normal', 'reserve']) {
    const state = run([sheltered('full', airMode), sheltered()]);
    assert.equal(state.outcome, 'secured');
    assert.equal(state.harvest, harvestTarget);
    assert.equal(state.battery, airMode === 'normal' ? 0 : 1);
    assert.equal(state.air, airMode === 'normal' ? 3 : 1);
  }
});

test('alternate scenario requires saving power and announces a different cost in the peak', () => {
  const first = run([sheltered('full')], 'lowPower');
  assert.equal(first.phase, 'rising');
  assert.equal(projectShift(first, sheltered()).powerUsed, 5);
  assert.equal(commitShift(first, sheltered()), undefined);
  assert.equal(run([sheltered('full', 'reserve'), sheltered()], 'lowPower').outcome, 'secured');
});

test('peak reserve settings cannot preserve enough air; exposure always ends training', () => {
  const first = run([sheltered('full')]);
  const second = commitShift(first, sheltered('dim', 'reserve')).next;
  assert.equal(second.harvest, harvestTarget);
  assert.equal(second.outcome, 'air');
  assert.equal(recover(second).phase, 'peak');

  const unsafe = run([{ ...sheltered('full'), location: 'standard' }]);
  assert.equal(unsafe.outcome, 'exposure');
  assert.equal(commitShift(unsafe, sheltered()), undefined);
});

test('every possible full success in both scenarios protects the crew in both shifts', () => {
  const choices = ['standard', 'shelter'].flatMap(location =>
    ['normal', 'reserve'].flatMap(airMode => ['off', 'dim', 'full'].map(lights => ({ location, airMode, lights }))),
  );
  for (const scenario of ['standard', 'lowPower']) {
    let successes = 0;
    for (const first of choices) for (const second of choices) {
      const early = commitShift(startMission(scenario), first)?.next;
      const final = early && commitShift(early, second)?.next;
      if (final?.outcome !== 'secured') continue;
      successes++;
      assert.equal(first.location, 'shelter');
      assert.equal(second.location, 'shelter');
      assert.ok(final.air > 0);
      assert.ok(final.harvest >= harvestTarget);
    }
    assert.ok(successes >= (scenario === 'standard' ? 2 : 1));
  }
});
