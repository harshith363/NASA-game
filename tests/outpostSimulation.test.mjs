import assert from 'node:assert/strict';
import { test } from 'node:test';
import { departureWindow } from '../src/mission/lunarCampaign.ts';
import { newOutpost, buildFacility, stepOutpost, rates, parseOutpost, constructionTypes, departureChecks, launchReturn, returnCommand } from '../src/mission/outpostSimulation.ts';

test('construction charges once, enforces plots and completes one queued job at a time', () => {
  const s = newOutpost(null);
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
  const s = newOutpost(null);
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

test('starting resources support splashdown from either departure window at every playback speed', () => {
  for (const speed of [1, 2, 4]) {
    for (const departureTick of [720, 1620]) {
      let s = newOutpost(null);
      buildFacility(s, 'solar', 0); buildFacility(s, 'greenhouse', 1); buildFacility(s, 'battery', 2);
      const departureAlerts = [];
      while (s.elapsed < departureTick && s.outcome === 'active') {
        s.sheltered = (s.elapsed >= 180 && s.elapsed < 360) || (s.elapsed >= 570 && s.elapsed < 690);
        for (let tick = 0; tick < speed; tick++) {
          if (!stepOutpost(s)) continue;
          if (/^(Departure window open|Window missed)/.test(s.message)) departureAlerts.push(s.elapsed);
          s = parseOutpost(JSON.stringify(s));
          break;
        }
      }
      assert.equal(s.outcome, 'active');
      assert.equal(s.elapsed, departureTick);
      assert.deepEqual(departureAlerts, departureTick === 720 ? [720] : [720, 900, 1620]);
      assert.deepEqual(departureChecks(s), { windowOpen: true, crew: true, supplies: true });
      assert.ok(launchReturn(s));
      assert.equal(s.campaign.flight.departureTick, departureTick);
      assert.equal(launchReturn(s), false);
      [0, 1, 0, 1, 0].forEach((choice, stage) => {
        assert.equal(returnCommand(s, stage, choice), '');
        assert.deepEqual(parseOutpost(JSON.stringify(s)), s);
      });
      assert.equal(s.outcome, 'ready');
    }
  }
});

test('departure window boundaries are exclusive at close and protect the ship load', () => {
  for (const [tick, open, nextOpening] of [
    [719, false, 720], [720, true, 1620], [899, true, 1620], [900, false, 1620],
    [1619, false, 1620], [1620, true, 2520], [1799, true, 2520], [1800, false, 2520],
  ]) {
    const s = newOutpost(null);
    s.elapsed = tick - 1;
    const boundary = [720, 900, 1620, 1800].includes(tick);
    assert.equal(stepOutpost(s), boundary);
    assert.equal(departureWindow(s.elapsed).nextOpening, nextOpening);
    const resumed = parseOutpost(JSON.stringify(s));
    assert.equal(stepOutpost(resumed), !boundary);
    const before = JSON.stringify(s);
    assert.equal(launchReturn(s), open);
    if (!open) assert.equal(JSON.stringify(s), before);
  }
});

test('mission failure takes priority on the opening tick', () => {
  const s = newOutpost(null);
  s.elapsed = 719;
  s.food = .01;
  assert.equal(stepOutpost(s), true);
  assert.equal(s.outcome, 'failed');
  assert.match(s.message, /ran out of food/);
});

test('a legacy return launched outside the new windows can resume and finish', () => {
  const legacy = newOutpost(null);
  legacy.elapsed = 900;
  legacy.campaign.flight = { stage: 1, fuel: 4, battery: 7, oxygen: 5 };
  const resumed = parseOutpost(JSON.stringify(legacy));
  [1, 0, 1, 0].forEach((choice, stage) => assert.equal(returnCommand(resumed, stage + 1, choice), ''));
  assert.equal(resumed.outcome, 'ready');
  assert.deepEqual(parseOutpost(JSON.stringify(resumed)), resumed);
});

test('speed batches preserve equal-time results and save resumes exactly', () => {
  const run = batch => { let s = newOutpost(null); buildFacility(s, 'solar', 0); for(let i=0;i<120;i+=batch) for(let j=0;j<batch;j++) stepOutpost(s); return s; };
  assert.deepEqual(run(1), run(4));
  const original = run(2); const restored = parseOutpost(JSON.stringify(original));
  for(let i=0;i<20;i++) { stepOutpost(original); stepOutpost(restored); }
  assert.deepEqual(original, restored);
});

test('invalid saves and unavailable construction are rejected', () => {
  const s = newOutpost(null);
  for (const field of ['food','water','oxygen','battery','materials']) assert.equal(parseOutpost(JSON.stringify({...s,[field]: -1})), undefined);
  assert.equal(parseOutpost(JSON.stringify({...s, facilities:[{type:'missing',plot:0,progress:0}]})), undefined);
  s.materials = 0; assert.ok(buildFacility(s, 'solar', 0));
  assert.equal(s.facilities.length, 0);
  s.outcome = 'failed'; const before = JSON.stringify(s); stepOutpost(s); assert.equal(JSON.stringify(s), before);
});

test('power exhaustion alerts once and unpowered greenhouses stop producing food', () => {
  const s = newOutpost(null);
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
  let s = newOutpost(null);
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
  assert.match(roverCommand(s, 'collect', 'aya', 'cache'), /Loaded 40/);
  assert.equal(s.materials, 100);
  s = parseOutpost(JSON.stringify(s));
  assert.equal(s.campaign.rover.cargo, 40);
  assert.match(roverCommand(s, 'collect', 'aya', 'cache'), /Scan for a cache/);
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
  const s = newOutpost(null);
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
  const old = newOutpost(null);
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
  const s = newOutpost(null);
  s.elapsed = 720;
  s.food = 4.9;
  assert.equal(assignJob(s, 'noah', 'survey'), '');
  roverCommand(s, 'board', 'mateo');
  s.sheltered = true;
  const detail = departureStatus(s);
  const before = JSON.stringify(s);
  assert.equal(launchReturn(s), false);
  assert.equal(JSON.stringify(s), before);
  assert.equal(detail.docked, false); // At the pad but still aboard.
  assert.equal(detail.shelterReleased, false);
  assert.deepEqual(detail.activeJobs.map(member => member.id), ['noah']);
  assert.deepEqual(detail.supplies.find(supply => supply.key === 'food'), { key: 'food', available: 4.9, required: 5 });
  releaseDepartureJobs(s);
  roverCommand(s, 'dock');
  s.sheltered = false;
  assert.deepEqual(departureChecks(s), { windowOpen: true, crew: true, supplies: false });
  const shortOnFood = JSON.stringify(s);
  assert.equal(launchReturn(s), false);
  assert.equal(JSON.stringify(s), shortOnFood);
});

test('mission scoring rewards safe recovery and exploration on a fixed scale', async () => {
  const { missionScore } = await import('../src/mission/outpostSimulation.ts');
  const s = newOutpost(null);
  s.elapsed = 720;
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
  const s = newOutpost(null);
  roverCommand(s, 'board', 'aya');
  assert.match(roverCommand(s, 'scan'), /East Rim/);
  assert.deepEqual(s.campaign.rover.contacts, ['cache', 'west', 'shoulder']);
  assert.match(roverCommand(s, 'scan'), /recharge/);
  s.elapsed += 4;
  s.campaign.rover.position = cacheSites.ridge.point;
  assert.match(roverCommand(s, 'collect', 'aya', 'ridge'), /Scan for a cache/);
  assert.match(roverCommand(s, 'scan'), /High Ridge/);
  assert.match(roverCommand(s, 'collect', 'aya', 'ridge'), /Loaded 35/);
  assert.match(roverCommand(s, 'collect', 'aya', 'ridge'), /Scan for a cache/);
  assert.ok(parseOutpost(JSON.stringify(s)));
});

test('rover accelerates smoothly and fixed movement substeps give equivalent results', async () => {
  const { stepRover, driveStep } = await import('../src/mission/lunarCampaign.ts');
  const { roverCommand } = await import('../src/mission/outpostSimulation.ts');
  const s = newOutpost(null);
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
  const s = newOutpost(null);
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
  const previous = newOutpost(null);
  for (let i = 0; i < 30; i++) stepOutpost(previous);
  slots.set(outpostSaveKey, JSON.stringify(previous));
  const key = landedOutpostKey('first-flight');
  assert.ok(isLandedOutpostKey(key));
  assert.equal(isLandedOutpostKey(outpostSaveKey), false);
  assert.equal(isLandedOutpostKey(lastLandedOutpostKey), false);
  assert.equal(slots.has(key), false);
  slots.set(key, JSON.stringify(newOutpost(null)));
  assert.equal(parseOutpost(slots.get(key)).elapsed, 0);
  assert.equal(parseOutpost(slots.get(outpostSaveKey)).elapsed, 30);
  assert.equal(slots.has(landedOutpostKey('second-flight')), false);
});

test('each saved incident draw permits a first- or second-window departure at every speed', async () => {
  const { assignJob, cleanArray, outpostForecast, outpostIncident, outpostStorm } = await import('../src/mission/outpostSimulation.ts');
  const { drawHazards, lunarIncidents } = await import('../src/mission/lunarHazards.ts');
  for (const random of [() => 0, () => .999999]) {
    for (const type of Object.keys(lunarIncidents)) {
      const schedule = drawHazards(random);
      schedule.incident.type = type;
      for (const finish of [720, 1620]) {
        let reference;
        for (const speed of [1, 2, 4]) {
          let state = parseOutpost(JSON.stringify(newOutpost(schedule)));
          assert.deepEqual(state.campaign.hazards, schedule);
          buildFacility(state, 'solar', 0);
          buildFacility(state, 'greenhouse', 1);
          assert.equal(assignJob(state, 'leena', 'safety'), '');
          const alerts = [];
          while (state.outcome === 'active' && state.elapsed < finish) {
            for (let tick = 0; tick < speed; tick++) {
              if (!stepOutpost(state)) continue;
              const now = state.elapsed;
              alerts.push(now);
              state = parseOutpost(JSON.stringify(state));
              assert.ok(state);
              const phase = outpostStorm(state);
              const forecast = outpostForecast(state);
              if (phase === 'warning' && now === forecast.warning) {
                state.sheltered = true;
                (state.campaign.stormAcknowledged ??= []).push(forecast.id);
              }
              if (schedule.storms.some(storm => now === storm.start + storm.duration)) state.sheltered = false;
              if (now === schedule.incident.tick) {
                assert.equal(outpostIncident(state).type, type);
                state.campaign.incident.acknowledged = true;
                const before = state.materials;
                if (type === 'dust') {
                  assert.equal(cleanArray(state), '');
                  const power = state.battery;
                  assert.ok(cleanArray(state));
                  assert.equal(state.battery, power);
                } else {
                  const id = type === 'impact' ? 'aya' : 'mateo';
                  const job = lunarIncidents[type].job;
                  assert.equal(assignJob(state, id, job), '');
                  assert.ok(assignJob(state, id, job));
                  assert.equal(state.materials, before - (type === 'impact' ? 12 : 0));
                }
              }
              break;
            }
          }
          assert.equal(state.elapsed, finish);
          assert.equal(state.outcome, 'active');
          assert.equal(alerts.filter(tick => tick === schedule.incident.tick).length, 1);
          assert.ok(outpostIncident(state).resolvedAt);
          assert.deepEqual(state.campaign.stormAcknowledged, [1, 2]);
          assert.ok(launchReturn(state));
          [0, 1, 0, 1, 0].forEach((choice, stage) => assert.equal(returnCommand(state, stage, choice), ''));
          assert.equal(state.outcome, 'ready');
          if (reference) assert.deepEqual(state, reference);
          reference = state;
        }
      }
    }
  }
});

test('crew reports paused work and job-level cooldown independently of astronaut availability', async () => {
  const { assignJob, crewActivity, jobAvailability } = await import('../src/mission/outpostSimulation.ts');
  let state = newOutpost(null);
  assert.equal(assignJob(state, 'imani', 'crops'), '');
  state.growLights = false;
  assert.match(crewActivity(state, 'imani'), /Paused.*Turn on greenhouse lights/);
  state.sheltered = true;
  assert.match(crewActivity(state, 'imani'), /Returning to shelter.*Paused/);
  for (let i = 0; i < 15; i++) stepOutpost(state);
  assert.match(crewActivity(state, 'imani'), /Sheltered.*Paused/);
  state.sheltered = false;
  state.growLights = true;
  while (state.campaign.workers.imani.assignment) stepOutpost(state);
  assert.match(crewActivity(state, 'imani'), /Available/);
  const expires = state.campaign.cooldowns.crops;
  assert.match(jobAvailability(state, 'crops'), /Available in/);
  assert.equal(assignJob(state, 'imani', 'survey'), '');
  while (state.elapsed < expires - 1) stepOutpost(state);
  state = parseOutpost(JSON.stringify(state));
  assert.equal(jobAvailability(state, 'crops'), 'Available in 1 sim second');
  stepOutpost(state);
  assert.equal(jobAvailability(state, 'crops'), '');
});

test('new cache and geology routes stay within a single battery charge and survive reload', async () => {
  const { roverCommand, nearbyLandmark, visitLandmark, collectSpecimen } = await import('../src/mission/outpostSimulation.ts');
  const { atDestination, idleDrive, locations, stepRover } = await import('../src/mission/lunarCampaign.ts');
  const { lunarLandmarks } = await import('../src/data/lunarLandmarks.ts');
  const { cacheSites } = await import('../src/mission/lunarSurface.ts');
  for (const [cache, landmark] of [['west', 'genesis'], ['shoulder', 'northRay'], ['pass', 'genesis'], [null, 'orangeGlass']]) {
    let state = newOutpost(null);
    assert.match(roverCommand(state, 'board'), /Rover ready/);
    let substeps = 0;
    function driveTo([x, z], reached) {
      const rover = state.campaign.rover;
      for (let step = 0; !reached() && step < 750; step++) {
        const angle = Math.atan2(x - rover.position[0], z - rover.position[1]) - rover.heading;
        const bearing = Math.atan2(Math.sin(angle), Math.cos(angle));
        stepRover(rover, { throttle: Math.abs(bearing) < .25 ? .9 : 0, turn: Math.max(-1, Math.min(1, bearing * 2)) }, .1);
        if (++substeps % 10 === 0) stepOutpost(state);
      }
      stepRover(rover, idleDrive, .6);
      assert.ok(reached(), `reach ${x}, ${z} on ${cache ?? landmark} route`);
    }
    if (cache) {
      const stop = cacheSites[cache];
      assert.match(roverCommand(state, 'collect', 'aya', cache), /Scan for a cache/);
      driveTo(stop.point, () => atDestination(state.campaign.rover, cache));
      assert.match(roverCommand(state, 'scan'), new RegExp(stop.name));
      assert.match(roverCommand(state, 'collect', 'aya', cache), new RegExp(`Loaded ${stop.materials}`));
      assert.match(roverCommand(state, 'collect', 'aya', cache), /Scan for a cache/);
    }
    driveTo(lunarLandmarks[landmark].point, () => nearbyLandmark(state) === landmark);
    const rover = state.campaign.rover;
    rover.velocity = 2;
    assert.match(visitLandmark(state, landmark), /Slow down/);
    rover.velocity = 0;
    assert.equal(visitLandmark(state, landmark), '');
    assert.equal(collectSpecimen(state, landmark), '');
    assert.ok(collectSpecimen(state, landmark));
    state = parseOutpost(JSON.stringify(state));
    assert.equal(state.campaign.rover.specimens[landmark], 'aboard');
    driveTo(locations.dock, () => atDestination(state.campaign.rover, 'dock'));
    assert.match(roverCommand(state, 'dock'), /specimens logged/);
    assert.equal(state.campaign.rover.specimens[landmark], 'delivered');
    assert.equal(state.campaign.rover.delivered, cache ? cacheSites[cache].materials : 0);
    assert.ok(state.campaign.rover.charge > 3);
    assert.ok(state.elapsed < 90);
    assert.deepEqual(parseOutpost(JSON.stringify(state)), state);
  }
});

test('cache target mismatches, full cargo, unsafe sample collection and tow recovery are handled', async () => {
  const { roverCommand, visitLandmark, collectSpecimen } = await import('../src/mission/outpostSimulation.ts');
  const { lunarLandmarks } = await import('../src/data/lunarLandmarks.ts');
  const { cacheSites } = await import('../src/mission/lunarSurface.ts');
  let state = newOutpost(null);
  roverCommand(state, 'board');
  const rover = state.campaign.rover;
  rover.contacts = ['cache', 'west', 'pass'];
  rover.position = cacheSites.cache.point;
  assert.match(roverCommand(state, 'collect', 'aya', 'west'), /Scan for a cache/);
  assert.match(roverCommand(state, 'collect', 'aya', 'cache'), /Loaded 40/);
  rover.position = cacheSites.pass.point;
  assert.match(roverCommand(state, 'collect', 'aya', 'pass'), /Cargo hold too full/);
  assert.equal(rover.cargo, 40);
  assert.deepEqual(rover.collected, ['cache']);
  rover.position = lunarLandmarks.genesis.point;
  assert.equal(visitLandmark(state, 'genesis'), '');
  state.elapsed = 180;
  assert.match(collectSpecimen(state, 'genesis'), /crew safety/);
  state.elapsed = 360;
  assert.equal(collectSpecimen(state, 'genesis'), '');
  assert.match(roverCommand(state, 'rescue'), /Recovery team dispatched/);
  state = parseOutpost(JSON.stringify(state));
  for (let tick = 0; tick < 20; tick++) stepOutpost(state);
  assert.equal(state.campaign.rover.specimens.genesis, 'delivered');
  assert.equal(state.campaign.rover.delivered, 40);
  assert.equal(state.campaign.rover.driver, undefined);
  roverCommand(state, 'board');
  state.campaign.rover.position = lunarLandmarks.genesis.point;
  assert.equal(visitLandmark(state, 'genesis'), '');
  assert.ok(collectSpecimen(state, 'genesis'));
  assert.equal(state.campaign.rover.specimens.genesis, 'delivered');
});

test('job preview and completion respect storage caps', async () => {
  const { assignJob, jobPreview } = await import('../src/mission/outpostSimulation.ts');
  const state = newOutpost(null);
  state.facilities = [{ plot: 0, type: 'greenhouse', progress: 50 }];
  state.food = 39;
  assert.equal(jobPreview(state, 'crops'), '−1 power · +1 food · −1 water');
  assert.equal(assignJob(state, 'imani', 'crops'), '');
  while (state.campaign.workers.imani.assignment) stepOutpost(state);
  assert.equal(state.food, 40);
  assert.match(state.message, /−1 power · \+0\.4 food · −1 water/);
});

test('impact parts remain reserved across cancellation, reload, and reassignment', async () => {
  const { assignJob, releaseDepartureJobs } = await import('../src/mission/outpostSimulation.ts');
  const { drawHazards } = await import('../src/mission/lunarHazards.ts');
  const schedule = drawHazards(() => 0);
  const state = newOutpost(schedule);
  state.elapsed = schedule.incident.tick - 1;
  assert.equal(stepOutpost(state), true);
  assert.equal(assignJob(state, 'aya', 'arrayRepair'), '');
  assert.equal(state.materials, 88);
  releaseDepartureJobs(state);
  const resumed = parseOutpost(JSON.stringify(state));
  assert.equal(assignJob(resumed, 'aya', 'arrayRepair'), '');
  assert.equal(resumed.materials, 88);
  while (resumed.campaign.workers.aya.assignment) stepOutpost(resumed);
  assert.ok(resumed.campaign.incident.resolvedAt);
  assert.ok(assignJob(resumed, 'aya', 'arrayRepair'));
  assert.equal(resumed.materials, 88);
});

test('outpost training follows real construction, job progress, and shelter through the first three days', async () => {
  const { trainingTask, trainingEndTick } = await import('../src/mission/outpostTraining.ts');
  const { assignJob } = await import('../src/mission/outpostSimulation.ts');
  let state = newOutpost(null);
  state.training = { forecastChecked: false, complete: false };
  assert.equal(trainingTask(state), 'queue-solar');
  buildFacility(state, 'solar', 0);
  assert.equal(trainingTask(state), 'queue-greenhouse');
  buildFacility(state, 'greenhouse', 1);
  assert.equal(trainingTask(state), 'reach-day-two');
  while (state.elapsed < 60) stepOutpost(state);
  assert.equal(trainingTask(state), 'assign-power');
  assert.equal(assignJob(state, 'aya', 'power'), '');
  assert.equal(trainingTask(state), 'finish-power-job');
  state = parseOutpost(JSON.stringify(state));
  assert.equal(trainingTask(state), 'finish-power-job');
  while (state.elapsed < 120) stepOutpost(state);
  assert.equal(trainingTask(state), 'check-forecast');
  state.training.forecastChecked = true;
  assert.equal(trainingTask(state), 'recall-crew');
  state.sheltered = true;
  assert.equal(trainingTask(state), 'shelter-drill');
  while (state.elapsed < trainingEndTick) stepOutpost(state);
  assert.equal(trainingTask(state), 'complete');
  assert.equal(state.outcome, 'active');
  assert.equal(state.materials, 40);
  state.training.complete = true;
  assert.deepEqual(parseOutpost(JSON.stringify(state)).training, { forecastChecked: true, complete: true });
  state.training.complete = 'yes';
  assert.equal(parseOutpost(JSON.stringify(state)), undefined);
});
