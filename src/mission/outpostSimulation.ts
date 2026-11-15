import { cacheIds, cacheSites, cacheTotal, radarRange } from './lunarSurface.ts';
import { crew, type CrewId } from '../data/crew.ts';
import { campaignStorm, newCampaign, validCampaign, plots, jobs, stepWorkers, stepRover, migrateRover, cargoCapacity,
  shelteredCount, locations, atDestination, isDocked, roverCapacity, materialCapacity, finishTicks,
  shipLoad, advanceReturn, returnSteps, type Campaign, type DriveInput, type Job } from './lunarCampaign.ts';
export { plots };

export const constructionTypes = {
  solar: { name: 'Solar array', cost: 25, seconds: 35, description: '+5 power/day; reduced output during storms.' },
  battery: { name: 'Battery bank', cost: 20, seconds: 25, description: '+20 battery capacity; starts empty.' },
  greenhouse: { name: 'Greenhouse', cost: 35, seconds: 50, description: '+3 food/day; uses 2 power and 0.5 water/day.' },
} as const;
export type FacilityType = keyof typeof constructionTypes;
export interface Facility { plot: number; type: FacilityType; progress: number; enabled?: boolean }
export interface OutpostState {
  version: 1; elapsed: number; battery: number; food: number; water: number; oxygen: number;
  growLights?: boolean; recycler?: boolean; reserveAir?: boolean;
  materials: number; sheltered: boolean; facilities: Facility[];
  campaign: Campaign;
  outcome: 'active' | 'ready' | 'failed'; message: string;
}
export const outpostSaveKey = 'lunar-continuous-outpost-v1';
const landedOutpostPrefix = `${outpostSaveKey}/flight/`;
export const landedOutpostKey = (flightRunId: string) => landedOutpostPrefix + flightRunId;
export const lastLandedOutpostKey = `${outpostSaveKey}/last-flight`;
export function isLandedOutpostKey(key: string | null): key is string {
  return !!key && key.startsWith(landedOutpostPrefix)
    && key.length > landedOutpostPrefix.length && key.length <= landedOutpostPrefix.length + 100;
}

export function newOutpost(): OutpostState {
  return { version: 1, elapsed: 0, battery: 25, food: 18, water: 20, oxygen: 20, materials: 100,
    sheltered: false, facilities: [], campaign: newCampaign(), outcome: 'active', message: 'Build power and food capacity before the storm. Press Play when ready.' };
}
export const stormAt = campaignStorm;
export function nextBuild(state: OutpostState) {
  return state.facilities.find(f => f.progress < constructionTypes[f.type].seconds);
}
export function facilityJobs(state: OutpostState, target: 'farm' | 'control' | 'comms' | number): Job[] {
  if (target === 'farm') return ['crops', 'water'];
  if (target === 'control') return ['power', 'safety'];
  if (target === 'comms') return ['survey'];
  const facility = state.facilities.find(f => f.plot === target);
  return facility?.type === 'greenhouse' ? ['crops'] : facility ? ['power'] : [];
}
export function jobBlock(state: OutpostState, id: CrewId, job: Job, plot?: number) {
  if (state.outcome !== 'active' || state.campaign.flight) return 'Mission is no longer accepting assignments.';
  if (state.sheltered || stormAt(state.elapsed, state.campaign.safetyChecked) === 'peak') return 'Crew recall is active.';
  const { workers, cooldowns, rover, surveyed, safetyChecked } = state.campaign;
  if (!workers[id] || workers[id].assignment || rover.driver === id) return 'This astronaut is busy.';
  if (Object.values(workers).some(worker => worker.assignment?.job === job)) return 'This job is already assigned.';
  if ((cooldowns[job] ?? 0) > state.elapsed) return 'Job is cooling down.';
  if (job === 'survey' && surveyed) return 'Supply cache already surveyed.';
  if (job === 'safety' && safetyChecked) return 'Shelter already inspected.';
  if (plot !== undefined) {
    const facility = state.facilities.find(f => f.plot === plot);
    if (!facility || facility.enabled === false || facility.progress < constructionTypes[facility.type].seconds || !facilityJobs(state, plot).includes(job)) return 'Facility must be completed and online.';
  }
  return jobInputBlock(state, job);
}
function jobInputBlock(state: OutpostState, job: Job) {
  if (job === 'crops' && (state.growLights === false || state.water < 1 || state.battery < 1)) return 'Needs lights, 1 water and 1 power.';
  if (job === 'water' && (state.recycler === false || state.battery < 1)) return 'Needs the recycler and 1 power.';
  return '';
}
export function assignJob(state: OutpostState, id: CrewId, job: Job, plot?: number) {
  const blocked = jobBlock(state, id, job, plot);
  if (blocked) return blocked;
  state.campaign.workers[id].assignment = { job, plot, progress: 0 };
  return '';
}
function progressJobs(state: OutpostState, atJob: (id: CrewId) => boolean) {
  const campaign = state.campaign;
  for (const member of crew) {
    const worker = campaign.workers[member.id];
    const assignment = worker.assignment;
    if (!assignment || !atJob(member.id) || jobInputBlock(state, assignment.job)) continue;
    const { job, plot } = assignment;
    if (plot !== undefined && state.facilities.find(f => f.plot === plot)?.enabled === false) continue;
    if (++assignment.progress < jobs[job].ticks + (jobs[job].specialist === member.id ? 0 : 12)) continue;
    switch (job) {
      case 'power':
        if (campaign.upgraded) state.materials = Math.min(materialCapacity, state.materials + 5);
        campaign.upgraded = true;
        break;
      case 'crops':
        state.battery -= 1; state.water -= 1; state.food = Math.min(40, state.food + 4); break;
      case 'water':
        state.battery -= 1; state.water = Math.min(30, state.water + 3); break;
      case 'safety': campaign.safetyChecked = true; break;
      case 'survey': {
        campaign.surveyed = true;
        const revealed = radarContacts(campaign.rover, locations.survey);
        state.message = revealed.length ? `Tower radar found ${revealed.map(id => cacheSites[id].name).join(', ')}.` : 'Tower radar sweep complete. Use the rover scanner beyond the base.';
        break;
      }
    }
    delete worker.assignment;
    campaign.cooldowns[job] = state.elapsed + 60;
    if (job !== 'survey') state.message = `${member.name} completed ${jobs[job].name.toLowerCase()}.`;
  }
}

function radarContacts(rover: Campaign['rover'], origin: readonly [number, number]) {
  const found = cacheIds.filter(id => {
    const [x,z] = cacheSites[id].point;
    return !rover.contacts.includes(id) && Math.hypot(origin[0]-x,origin[1]-z) <= radarRange;
  });
  rover.contacts.push(...found);
  return found;
}
export function nearbyCache(state: OutpostState) {
  return state.campaign.rover.contacts.find(id => !state.campaign.rover.collected.includes(id) && atDestination(state.campaign.rover,id));
}
export function roverCommand(state: OutpostState, command: 'board' | 'dock' | 'collect' | 'visit' | 'rescue' | 'charge' | 'scan', driver: CrewId = 'aya') {
  if (state.outcome !== 'active' || state.campaign.flight) return 'The surface mission has ended.';
  const { rover, workers } = state.campaign;
  switch (command) {
    case 'board':
      if (state.sheltered || stormAt(state.elapsed, state.campaign.safetyChecked) === 'peak' || !isDocked(rover) || !workers[driver] || workers[driver].assignment || rover.charge < 1) return 'Departure requires available crew, battery, and safe conditions.';
      rover.driver = driver; workers[driver].position = rover.position;
      return 'Rover ready. Drive with WASD or the on-screen controls.';
    case 'dock':
      if (isDocked(rover) || !atDestination(rover, 'dock')) return 'Drive within the marked dock area first.';
      rover.position = locations.dock;
      rover.velocity = rover.steering = 0;
      state.materials = Math.min(materialCapacity, state.materials + rover.cargo);
      rover.delivered += rover.cargo; rover.cargo = 0; rover.rescue = 0;
      if (rover.driver) workers[rover.driver].position = locations.dock;
      delete rover.driver;
      return 'Rover docked. Cargo transferred to the base.';
    case 'collect': {
      const id = nearbyCache(state);
      if (!rover.driver || !id || Math.abs(rover.velocity) > .4) return 'Scan for a cache and stop within its marked area.';
      const site = cacheSites[id];
      if (rover.cargo + site.materials > cargoCapacity) return 'Cargo hold too full. Dock to unload first.';
      rover.cargo += site.materials;
      rover.collected.push(id);
      return `Loaded ${site.materials} materials from ${site.name}. Dock to unload.`;
    }
    case 'scan': {
      if (!rover.driver || rover.rescue || rover.charge < .6 || rover.radarReady > state.elapsed) return 'Radar needs 0.6 charge and time to recharge between scans.';
      rover.charge -= .6;
      rover.radarReady = state.elapsed + 4;
      const found = radarContacts(rover,rover.position);
      return found.length ? `Radar found ${found.map(id => cacheSites[id].name).join(', ')}.` : 'No new contacts within scan range.';
    }
    case 'visit':
      if (!rover.driver || !atDestination(rover, 'heritage')) return 'Drive to the marked historic overlook.';
      rover.heritage = true; return 'Apollo 12 and Surveyor 3 exhibit unlocked.';
    case 'rescue':
      if (!rover.driver || rover.rescue || state.materials < 5) return 'Recovery requires an undocked rover and 5 materials.';
      state.materials -= 5; rover.rescue = 20;
      return 'Recovery team dispatched. Keep time running while it tows the rover.';
    case 'charge': {
      if (!isDocked(rover) || state.battery <= 5 || rover.charge >= roverCapacity) return 'Dock the rover and keep at least 5 power in the base to charge.';
      const charge = Math.min(state.battery - 5, roverCapacity - rover.charge, 10);
      state.battery -= charge; rover.charge += charge;
      return `Transferred ${charge.toFixed(1)} power to the rover.`;
    }
  }
}
export function departureStatus(state: OutpostState) {
  return {
    survived: state.elapsed >= finishTicks,
    docked: isDocked(state.campaign.rover),
    shelterReleased: !state.sheltered,
    stormClear: stormAt(state.elapsed, state.campaign.safetyChecked) !== 'peak',
    activeJobs: crew.filter(({ id }) => state.campaign.workers[id].assignment),
    supplies: (Object.keys(shipLoad) as (keyof typeof shipLoad)[]).map(key => ({
      key, available: state[key], required: shipLoad[key],
    })),
  };
}

export function departureChecks(state: OutpostState) {
  const status = departureStatus(state);
  return {
    survived: status.survived,
    crew: status.docked && status.shelterReleased && status.stormClear && !status.activeJobs.length,
    supplies: status.supplies.every(({ available, required }) => available >= required),
  };
}

export function releaseDepartureJobs(state: OutpostState) {
  if (state.outcome !== 'active' || state.campaign.flight || state.elapsed < finishTicks) return;
  for (const worker of Object.values(state.campaign.workers)) delete worker.assignment;
  state.message = 'Crew recalled from assigned jobs for departure.';
}

export function launchReturn(state: OutpostState) {
  if (state.outcome !== 'active' || state.campaign.flight || !Object.values(departureChecks(state)).every(Boolean)) return false;
  state.materials -= shipLoad.materials; state.battery -= shipLoad.battery;
  state.oxygen -= shipLoad.oxygen; state.food -= shipLoad.food;
  state.campaign.flight = { stage: 0, fuel: 6, battery: 8, oxygen: 6 };
  return true;
}
export function returnCommand(state: OutpostState, expectedStage: number, choice: number) {
  const flight = state.campaign.flight;
  if (!flight || flight.stage !== expectedStage || state.outcome !== 'active') return 'This command is no longer available.';
  const error = advanceReturn(flight, choice);
  if (!error && flight.stage === returnSteps.length) {
    state.outcome = 'ready';
    state.message = 'Splashdown confirmed. All five astronauts recovered.';
  }
  return error ?? '';
}

export function rates(state: OutpostState) {
  const count = (type: FacilityType) => state.facilities.filter(f => f.type === type && f.enabled !== false && f.progress >= constructionTypes[type].seconds).length;
  const storm = stormAt(state.elapsed, state.campaign.safetyChecked) === 'peak';
  const solarOutput = (6 + Number(state.campaign.upgraded) + count('solar') * 5) * (storm ? .3 : 1);
  const greenhouses = state.growLights === false ? 0 : count('greenhouse');
  return { solarOutput, battery: solarOutput - 5 + Number(state.recycler === false) + Number(state.reserveAir === true) - greenhouses * 2 - Number(state.sheltered),
    food: (state.battery > 0 && state.water > 0 ? greenhouses * 3 : 0) - 2, water: (state.recycler === false ? -1 : .8) - greenhouses * .5,
    oxygen: state.battery > 0 && !state.reserveAir ? .5 : -3, capacity: 30 + count('battery') * 20 };
}
export function buildFacility(state: OutpostState, type: FacilityType, plot: number): string | undefined {
  if (state.outcome !== 'active') return 'Start a new mission to build.';
  if (!Object.hasOwn(constructionTypes, type) || !Number.isInteger(plot) || plot < 0 || plot >= plots.length) return 'Choose a valid plot.';
  if (state.campaign.flight) return 'The return flight has started.';
  if (state.facilities.some(f => f.plot === plot)) return 'This plot is occupied.';
  if (state.materials < constructionTypes[type].cost) return 'Not enough construction materials.';
  state.materials -= constructionTypes[type].cost;
  state.facilities.push({ plot, type, progress: 0 });
  state.message = `${constructionTypes[type].name} queued. Two astronauts build one facility at a time.`;
}
// One simulated second per step, independent of rendering and playback speed.
export function stepOutpost(state: OutpostState, drive?: DriveInput): boolean {
  if (state.outcome !== 'active' || state.campaign.flight) return false;
  const { campaign } = state;
  const earlier = campaign.safetyChecked;
  const oldPhase = stormAt(state.elapsed, earlier);
  const previousBattery = state.battery;
  const flow = rates(state);
  state.battery = Math.max(0, Math.min(flow.capacity, state.battery + flow.battery / 60));
  state.food = Math.max(0, Math.min(40, state.food + flow.food / 60));
  state.water = Math.max(0, Math.min(30, state.water + flow.water / 60));
  state.oxygen = Math.max(0, Math.min(20, state.oxygen + flow.oxygen / 60));
  const { rover } = campaign;
  if (rover.rescue > 0 && --rover.rescue === 0) {
    rover.position = locations.dock;
    rover.charge = Math.max(2, rover.charge);
    roverCommand(state, 'dock');
    state.message = 'Rover recovery complete. Driver and cargo are back at the outpost.';
  }
  if (drive) stepRover(rover, drive);
  const job = nextBuild(state);
  // Exposure is assessed when a storm tick starts, before movement can catch up.
  const outside = oldPhase === 'peak' ? crew.length - shelteredCount(campaign, state.sheltered) : 0;
  const exposed = outside > 0;
  const workers = stepWorkers(campaign, state.sheltered, job?.plot);
  if (!state.sheltered && oldPhase !== 'peak') progressJobs(state, workers.atJob);
  if (job && workers.building && oldPhase !== 'peak') {
    job.progress++;
    if (job.progress === constructionTypes[job.type].seconds) state.message = `${constructionTypes[job.type].name} is now operational.`;
  }
  state.elapsed++;
  const phase = stormAt(state.elapsed, campaign.safetyChecked);
  let alert = phase !== oldPhase;
  if (alert) state.message = phase === 'warning' ? 'Particle warning. Recall the crew and return any rover to the dock.'
    : phase === 'peak' ? 'Storm has arrived. Keep the crew sheltered; outdoor construction is suspended.'
    : 'Storm passed. Crew can return to work. Resume work and prepare for departure.';
  if (state.battery === 0 && previousBattery > 0 && flow.battery < 0 && !alert) {
    alert = true; state.message = 'Battery exhausted. Oxygen reserves are being consumed. Add solar capacity.';
  }
  if (state.food <= 0 || state.water <= 0 || state.oxygen <= 0 || exposed) {
    state.outcome = 'failed'; const depleted = (['food', 'water', 'oxygen'] as const).filter(resource => state[resource] <= 0);
    state.message = exposed
      ? `Mission interrupted: ${outside} crew outside shelter when the storm hit.`
      : `Mission interrupted: the outpost ran out of ${depleted.join(', ')}.`; alert = true;
  } else if (state.elapsed === finishTicks) {
    state.message = 'Fifteen days survived. Check the departure checklist and prepare to launch.';
    alert = true;
  }
  return alert;
}
export function parseOutpost(raw: string): OutpostState | undefined {
  try {
    const s = JSON.parse(raw) as OutpostState;
    if (s.version !== 1 || !Number.isInteger(s.elapsed) || s.elapsed < 0 || s.elapsed > 1e7 || typeof s.sheltered !== 'boolean'
      || !['active', 'ready', 'failed'].includes(s.outcome) || typeof s.message !== 'string' || s.message.length > 500
      || !Array.isArray(s.facilities) || s.facilities.length > plots.length) return;
    if (!s.facilities.every(f => f && Object.hasOwn(constructionTypes, f.type) && Number.isInteger(f.plot) && f.plot >= 0 && f.plot < plots.length
      && Number.isInteger(f.progress) && f.progress >= 0 && f.progress <= constructionTypes[f.type].seconds)
      || new Set(s.facilities.map(f => f.plot)).size !== s.facilities.length) return;
    if ([s.growLights, s.recycler, s.reserveAir, ...s.facilities.map(f => f.enabled)].some(value => value !== undefined && typeof value !== 'boolean')) return;
    if (s.campaign === undefined) {
      s.campaign = newCampaign(s.sheltered);
      if (s.outcome === 'ready') {
        s.outcome = 'active';
        s.message = 'Your outpost is established. Continue to the fifteen-day departure objective.';
      }
    }
    if (s.campaign?.rover) migrateRover(s.campaign);
    if (!validCampaign(s.campaign) || (s.outcome === 'ready') !== (s.campaign.flight?.stage === returnSteps.length)) return;
    const limits = { battery: rates(s).capacity, food: 40, water: 30, oxygen: 20, materials: materialCapacity };
    for (const key of Object.keys(limits) as (keyof typeof limits)[]) if (!Number.isFinite(s[key]) || s[key] < 0 || s[key] > limits[key]) return;
    return s;
  } catch { return; }
}

// One mission day takes 60 real seconds at 1×. Keep fixed ticks for old save compatibility.
export const ticksPerDay = 60;
export function missionDay(elapsed: number) { return `Day ${(1 + elapsed / ticksPerDay).toFixed(2)}`; }
export function daysRemaining(ticks: number) { return `${Math.max(0, ticks / ticksPerDay).toFixed(2)} days`; }
export function setFacilityEnabled(state: OutpostState, plot: number, enabled: boolean) {
  const facility = state.facilities.find(f => f.plot === plot);
  if (!facility || facility.progress < constructionTypes[facility.type].seconds || state.outcome !== 'active' || state.campaign.flight) return;
  facility.enabled = enabled;
  state.battery = Math.min(state.battery, rates(state).capacity);
}

/** Compare every run against the same goals. No leaderboard or network data. */
export function missionScore(state: OutpostState) {
  const flow = rates(state);
  const percent = (value: number, target: number) => Math.min(1, Math.max(0, value / target));
  const reservePoints = 5 * percent(state.battery, 12) + 5 * percent(state.food, 8)
    + 5 * percent(state.water, 10) + 5 * percent(state.oxygen, 8) + 5 * percent(state.materials, 15);
  const categories = [
    { label: 'Survival & return', points: Math.round(25 * percent(state.elapsed, finishTicks)) + (state.outcome === 'ready' ? 15 : 0), max: 40, detail: '25 for surviving 15 days and 15 for safe splashdown.' },
    { label: 'Outpost reserves', points: Math.round(reservePoints), max: 25, detail: 'Up to 5 each for 12 power, 8 food, 10 water, 8 oxygen, and 15 materials remaining at the base after ship loading.' },
    { label: 'Sustainable operations', points: 5 * [flow.battery, flow.food, flow.water].filter(rate => rate >= 0).length, max: 15, detail: '5 each for steady or increasing power, food, and water.' },
    { label: 'Exploration', points: Math.round(12 * percent(state.campaign.rover.delivered, cacheTotal)) + (state.campaign.rover.heritage ? 8 : 0), max: 20, detail: 'Up to 12 for delivering all cache supplies and 8 for visiting the historic overlook.' },
  ];
  const total = categories.reduce((sum, category) => sum + category.points, 0);
  const rating = total >= 90 ? 'Exceptional' : total >= 75 ? 'Strong' : total >= 60 ? 'Solid' : 'Needs improvement';
  return { total, rating, categories };
}
