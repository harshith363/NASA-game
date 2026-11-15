import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newOutpost, buildFacility, stepOutpost, rates, parseOutpost, constructionTypes, departureChecks, launchReturn, returnCommand } from '../src/mission/outpostSimulation.ts';

test('construction charges once, enforces plots and completes one queued job at a time', () => {
  const s = newOutpost();
  assert.equal(buildFacility(s, 'solar', 0), undefined);
  assert.ok(buildFacility(s, 'battery', 0));
  assert.ok(buildFacility(s, 'solar', -1));
  buildFacility(s, 'greenhouse', 1);
  assert.equal(s.materials, 40);
  while (s.facilities[0].progress < 35 && s.elapsed < 60) stepOutpost(s);
  assert.equal(s.facilities[0].progress, 35);
  assert.equal(s.facilities[1].progress, 0);
  assert.equal(rates(s).battery, 6);
  s.sheltered = true; stepOutpost(s);
  assert.equal(s.facilities[1].progress, 0);
});

test('timed warning pauses at the exact boundary and storm permits shelter response', () => {
  const s = newOutpost();
  for (let i=0;i<179;i++) assert.equal(stepOutpost(s), false);
  assert.equal(stepOutpost(s), true);
  assert.equal(s.elapsed, 180);
  s.sheltered = true;
  while(s.elapsed < 240) stepOutpost(s);
  assert.equal(s.outcome, 'active');
  stepOutpost(s);
  assert.equal(s.outcome, 'active');
  s.sheltered = false; stepOutpost(s);
  assert.equal(s.outcome, 'failed');
});

test('starting resources support successful construction and storm survival', () => {
  const s = newOutpost();
  buildFacility(s, 'solar', 0); buildFacility(s, 'greenhouse', 1); buildFacility(s, 'battery', 2);
  while (s.elapsed < 900 && s.outcome === 'active') {
    s.sheltered = (s.elapsed >= 180 && s.elapsed < 360) || (s.elapsed >= 570 && s.elapsed < 690);
    stepOutpost(s);
  }
  assert.equal(s.outcome, 'active');
  assert.equal(s.elapsed, 900);
  assert.deepEqual(departureChecks(s), { survived: true, crew:true, supplies:true });
  assert.ok(launchReturn(s));
  assert.equal(launchReturn(s), false);
  [0,1,0,1,0].forEach((choice, stage) => {
    assert.equal(returnCommand(s, stage, choice), '');
    assert.deepEqual(parseOutpost(JSON.stringify(s)), s);
  });
  assert.equal(s.outcome, 'ready');
  assert.ok(s.battery >= 5);
  assert.deepEqual(parseOutpost(JSON.stringify(s)), s);
});

test('speed batches preserve equal-time results and save resumes exactly', () => {
  const run = batch => { let s = newOutpost(); buildFacility(s, 'solar', 0); for(let i=0;i<120;i+=batch) for(let j=0;j<batch;j++) stepOutpost(s); return s; };
  assert.deepEqual(run(1), run(4));
  const original = run(2); const restored = parseOutpost(JSON.stringify(original));
  for(let i=0;i<20;i++) { stepOutpost(original); stepOutpost(restored); }
  assert.deepEqual(original, restored);
});

test('invalid saves and unavailable construction are rejected', () => {
  const s = newOutpost();
  for (const field of ['food','water','oxygen','battery','materials']) assert.equal(parseOutpost(JSON.stringify({...s,[field]: -1})), undefined);
  assert.equal(parseOutpost(JSON.stringify({...s, facilities:[{type:'missing',plot:0,progress:0}]})), undefined);
  s.materials = 0; assert.ok(buildFacility(s, 'solar', 0));
  assert.equal(s.facilities.length, 0);
  s.outcome = 'failed'; const before = JSON.stringify(s); stepOutpost(s); assert.equal(JSON.stringify(s), before);
});

test('power exhaustion alerts once and unpowered greenhouses stop producing food', () => {
  const s = newOutpost();
  s.elapsed = 220; s.sheltered = true;
  while (s.elapsed < 250) stepOutpost(s); s.battery = .01;
  s.facilities = [{plot:0,type:'greenhouse',progress:constructionTypes.greenhouse.seconds}];
  assert.equal(stepOutpost(s), true);
  assert.equal(s.battery, 0);
  assert.equal(rates(s).food, -2);
  assert.equal(stepOutpost(s), false);
});

test('named survey worker discovers one cache, rover makes a powered round trip, and cargo survives reload', async () => {
  const { assignJob, roverCommand } = await import('../src/mission/outpostSimulation.ts');
  const { locations, atDestination, stepRover, idleDrive } = await import('../src/mission/lunarCampaign.ts');
  let s = newOutpost();
  assert.equal(assignJob(s, 'noah', 'survey'), '');
  assert.match(roverCommand(s, 'board', 'noah'), /available crew/);
  for (let i = 0; i < 25; i++) stepOutpost(s);
  assert.equal(s.campaign.surveyed, true);
  roverCommand(s, 'board', 'aya');
  assert.match(assignJob(s, 'aya', 'power'), /busy/);

  function driveTo(target) {
    for (let i = 0; !atDestination(s.campaign.rover, target) && i < 450; i++) {
      const { position, heading } = s.campaign.rover;
      const [x, z] = locations[target];
      const angle = Math.atan2(x - position[0], z - position[1]) - heading;
      const bearing = Math.atan2(Math.sin(angle), Math.cos(angle));
      stepRover(s.campaign.rover,{ throttle: Math.abs(bearing) < .26 ? .75 : 0, turn: Math.max(-1, Math.min(1, bearing * 2)) }, .1);
    }
    stepRover(s.campaign.rover,idleDrive,.6);
    assert.ok(atDestination(s.campaign.rover, target), target);
  }
  driveTo('cache');
  assert.match(roverCommand(s, 'collect'), /Loaded 40/);
  assert.equal(s.materials, 100);
  s = parseOutpost(JSON.stringify(s));
  assert.equal(s.campaign.rover.cargo, 40);
  assert.match(roverCommand(s, 'collect'), /Scan for a cache/);
  driveTo('heritage');
  roverCommand(s, 'visit');
  assert.equal(s.campaign.rover.heritage, true);
  driveTo('dock');
  roverCommand(s, 'dock');
  assert.equal(s.materials, 140);
  assert.ok(s.campaign.rover.charge < 30);
  assert.equal(s.campaign.rover.driver, undefined);
  assert.deepEqual(parseOutpost(JSON.stringify(s)), s);
});

test('recall tracks the rover driver and recovery returns the astronaut to the dock', async () => {
  const { roverCommand } = await import('../src/mission/outpostSimulation.ts');
  const { shelteredCount } = await import('../src/mission/lunarCampaign.ts');
  const s = newOutpost();
  roverCommand(s, 'board', 'aya');
  for (let i = 0; i < 6; i++) stepOutpost(s, { throttle: 1, turn: 0 });
  s.sheltered = true;
  for (let i = 0; i < 12; i++) stepOutpost(s);
  assert.equal(shelteredCount(s.campaign, true), 4);
  roverCommand(s, 'rescue');
  assert.equal(s.materials, 95);
  for (let i = 0; i < 35; i++) stepOutpost(s);
  assert.equal(shelteredCount(s.campaign, true), 5);
  assert.equal(s.campaign.rover.rescue, 0);
});

test('legacy outpost saves keep completed facilities and can continue a previously established base', () => {
  const old = newOutpost();
  delete old.campaign;
  old.outcome = 'ready';
  old.elapsed = 420;
  old.facilities = [{ plot: 0, type: 'solar', progress: 35 }];
  const migrated = parseOutpost(JSON.stringify(old));
  assert.equal(migrated.outcome, 'active');
  assert.equal(migrated.elapsed, 420);
  assert.deepEqual(migrated.facilities, old.facilities);
  assert.equal(Object.keys(migrated.campaign.workers).length, 5);
});

test('departure reports the exact crew and supply blockers and can release all jobs', async () => {
  const { assignJob, departureStatus, releaseDepartureJobs, roverCommand } = await import('../src/mission/outpostSimulation.ts');
  const s = newOutpost();
  s.elapsed = 900;
  s.food = 4.9;
  assert.equal(assignJob(s, 'noah', 'survey'), '');
  roverCommand(s, 'board', 'mateo');
  s.sheltered = true;
  const detail = departureStatus(s);
  assert.equal(detail.docked, false); // At the pad but still aboard.
  assert.equal(detail.shelterReleased, false);
  assert.deepEqual(detail.activeJobs.map(member => member.id), ['noah']);
  assert.deepEqual(detail.supplies.find(supply => supply.key === 'food'), { key: 'food', available: 4.9, required: 5 });
  releaseDepartureJobs(s);
  roverCommand(s, 'dock');
  s.sheltered = false;
  assert.deepEqual(departureChecks(s), { survived: true, crew: true, supplies: false });
  assert.equal(launchReturn(s), false);
});

test('mission scoring rewards safe recovery and exploration on a fixed scale', async () => {
  const { missionScore } = await import('../src/mission/outpostSimulation.ts');
  const s = newOutpost();
  s.elapsed = 900;
  s.food = 13;
  s.facilities = [
    { plot: 0, type: 'solar', progress: 35 },
    { plot: 1, type: 'greenhouse', progress: 50 },
  ];
  assert.ok(launchReturn(s));
  const before = missionScore(s);
  [0, 1, 0, 1, 0].forEach((choice, stage) => returnCommand(s, stage, choice));
  assert.equal(missionScore(s).total, before.total + 15);
  s.campaign.surveyed = true;
  const { cacheIds, cacheTotal } = await import('../src/mission/lunarSurface.ts');
  Object.assign(s.campaign.rover, { delivered: cacheTotal, contacts: [...cacheIds], collected: [...cacheIds], heritage: true });
  assert.equal(missionScore(s).total, 100);
  assert.deepEqual(missionScore(parseOutpost(JSON.stringify(s))), missionScore(s));
});

test('radar reveals only nearby sites and recovered caches cannot be collected twice', async () => {
  const { roverCommand } = await import('../src/mission/outpostSimulation.ts');
  const { cacheSites } = await import('../src/mission/lunarSurface.ts');
  const s = newOutpost();
  roverCommand(s, 'board', 'aya');
  assert.match(roverCommand(s, 'scan'), /East Rim/);
  assert.deepEqual(s.campaign.rover.contacts, ['cache']);
  assert.match(roverCommand(s, 'scan'), /recharge/);
  s.elapsed += 4;
  s.campaign.rover.position = cacheSites.ridge.point;
  assert.match(roverCommand(s, 'collect'), /Scan for a cache/);
  assert.match(roverCommand(s, 'scan'), /High Ridge/);
  assert.match(roverCommand(s, 'collect'), /Loaded 35/);
  assert.match(roverCommand(s, 'collect'), /Scan for a cache/);
  assert.ok(parseOutpost(JSON.stringify(s)));
});

test('rover accelerates smoothly and fixed movement substeps give equivalent results', async () => {
  const { stepRover, driveStep } = await import('../src/mission/lunarCampaign.ts');
  const { roverCommand } = await import('../src/mission/outpostSimulation.ts');
  const s = newOutpost();
  roverCommand(s, 'board');
  const a = s.campaign.rover, b = structuredClone(a);
  stepRover(a, { throttle: 1, turn: .4 }, driveStep);
  assert.ok(a.velocity > 0 && a.velocity < 1);
  for (let i=1;i<60;i++) stepRover(a, { throttle: 1, turn: .4 }, driveStep);
  stepRover(b, { throttle: 1, turn: .4 }, 1);
  assert.ok(Math.hypot(a.position[0]-b.position[0],a.position[1]-b.position[1]) < 1e-8);
  assert.ok(a.charge < 30);
});

test('old rover saves migrate collected East Rim cargo without granting it again', () => {
  const s = newOutpost();
  const rover = s.campaign.rover;
  delete rover.contacts; delete rover.collected; delete rover.velocity; delete rover.steering; delete rover.radarReady;
  rover.cacheLoaded = true;
  rover.delivered = 40;
  const migrated = parseOutpost(JSON.stringify(s));
  assert.deepEqual(migrated.campaign.rover.contacts, ['cache']);
  assert.deepEqual(migrated.campaign.rover.collected, ['cache']);
  assert.equal(migrated.campaign.rover.delivered,40);
});

test('landed flights use separate timed outpost save slots', async () => {
  const { isLandedOutpostKey, landedOutpostKey, lastLandedOutpostKey, outpostSaveKey } = await import('../src/mission/outpostSimulation.ts');
  const slots = new Map();
  const previous = newOutpost();
  for (let i = 0; i < 30; i++) stepOutpost(previous);
  slots.set(outpostSaveKey, JSON.stringify(previous));
  const key = landedOutpostKey('first-flight');
  assert.ok(isLandedOutpostKey(key));
  assert.equal(isLandedOutpostKey(outpostSaveKey), false);
  assert.equal(isLandedOutpostKey(lastLandedOutpostKey), false);
  assert.equal(slots.has(key), false);
  slots.set(key, JSON.stringify(newOutpost()));
  assert.equal(parseOutpost(slots.get(key)).elapsed, 0);
  assert.equal(parseOutpost(slots.get(outpostSaveKey)).elapsed, 30);
  assert.equal(slots.has(landedOutpostKey('second-flight')), false);
});
