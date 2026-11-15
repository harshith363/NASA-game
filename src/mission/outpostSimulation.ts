import { cacheIds, cacheSites, explorationMaterialTarget, radarRange, type CacheId } from './lunarSurface.ts';
import { crew, type CrewId } from '../data/crew.ts';
import type { TrainingSave } from './outpostTraining.ts';
import { landmarkIds, landmarkRadius, lunarLandmarks, type LandmarkId } from '../data/lunarLandmarks.ts';
import { cleaningPower, drawHazards, impactParts, lunarIncidents, stormSchedule, type HazardSchedule } from './lunarHazards.ts';
import { campaignStorm, newCampaign, validCampaign, plots, jobs, stepWorkers, stepRover, migrateRover, cargoCapacity, activeBuilders, workerStatus,
  shelteredCount, locations, atDestination, isDocked, roverCapacity, materialCapacity, firstDepartureTick, departureWindow, ticksPerDay,
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
  training?: TrainingSave;
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

export function newOutpost(hazards: HazardSchedule | null = drawHazards()): OutpostState {
  const campaign = newCampaign();
  if (hazards) campaign.hazards = structuredClone(hazards);
  return { version: 1, elapsed: 0, battery: 25, food: 18, water: 20, oxygen: 20, materials: 100,
    sheltered: false, facilities: [], campaign, outcome: 'active', message: 'Build power and food capacity before the storm. Press Play when ready.' };
}
export const stormAt = campaignStorm;
export function outpostStorm(state: OutpostState) {
  return stormAt(state.elapsed, state.campaign.safetyChecked, state.campaign.hazards);
}
export function outpostForecast(state: OutpostState) {
  return stormSchedule(state.elapsed, state.campaign.safetyChecked, state.campaign.hazards);
}
export function outpostIncident(state: OutpostState) {
  const { incident, hazards } = state.campaign;
  return incident && hazards ? { ...hazards.incident, ...incident, ...lunarIncidents[hazards.incident.type] } : undefined;
}
export function cleanArray(state: OutpostState) {
  const incident = outpostIncident(state);
  if (state.outcome !== 'active' || state.campaign.flight || incident?.type !== 'dust' || incident.resolvedAt !== undefined) return 'Cleaning is unavailable.';
  if (state.battery < cleaningPower) return `Wait until the battery has ${cleaningPower} power.`;
  state.battery -= cleaningPower;
  state.campaign.incident!.resolvedAt = state.elapsed;
  state.message = `Cleaning cycle complete · −${cleaningPower} power · normal generation restored.`;
  return '';
}
export function nextBuild(state: OutpostState) {
  return state.facilities.find(f => f.progress < constructionTypes[f.type].seconds);
}
export function facilityJobs(state: OutpostState, target: 'farm' | 'control' | 'comms' | number): Job[] {
  if (target === 'farm') return ['crops', 'water'];
  if (target === 'control') {
    const incidentJob = outpostIncident(state)?.job;
    return ['power', 'safety', 'crops', 'water', 'survey', ...(incidentJob ? [incidentJob] : [])];
  }
  if (target === 'comms') return ['survey'];
  const facility = state.facilities.find(f => f.plot === target);
  return facility?.type === 'greenhouse' ? ['crops'] : facility ? ['power'] : [];
}
export function jobAvailability(state: OutpostState, job: Job, plot?: number) {
  if (state.outcome !== 'active' || state.campaign.flight) return 'Mission is no longer accepting assignments.';
  const { workers, cooldowns, surveyed, safetyChecked } = state.campaign;
  const incident = outpostIncident(state);
  if (job === 'arrayRepair' || job === 'recyclerInspection') {
    if (incident?.job !== job || plot !== undefined) return 'This drill is unavailable.';
    if (incident.resolvedAt !== undefined) return 'Completed';
    if (job === 'arrayRepair' && !incident.partsReserved && state.materials < impactParts) return `Needs ${impactParts} materials.`;
  }
  if (Object.values(workers).some(worker => worker.assignment?.job === job)) return 'Assigned';
  if ((job === 'survey' && surveyed) || (job === 'safety' && safetyChecked)) return 'Completed';
  const wait = (cooldowns[job] ?? 0) - state.elapsed;
  if (wait > 0) return `Available in ${departureCountdown(wait)}`;
  if (state.sheltered || outpostStorm(state) === 'peak') return 'Crew recall is active.';
  if (plot !== undefined) {
    const facility = state.facilities.find(f => f.plot === plot);
    if (!facility || facility.enabled === false || facility.progress < constructionTypes[facility.type].seconds || !facilityJobs(state, plot).includes(job)) return 'Facility must be completed and online.';
  }
  return jobInputBlock(state, job);
}
export function jobBlock(state: OutpostState, id: CrewId, job: Job, plot?: number) {
  const availability = jobAvailability(state, job, plot);
  if (availability) return availability;
  const { workers, rover } = state.campaign;
  if (!workers[id] || workers[id].assignment || rover.driver === id) return 'This astronaut is busy.';
  return '';
}
function jobInputBlock(state: OutpostState, job: Job) {
  if (job === 'crops' && state.growLights === false) return 'Turn on greenhouse lights.';
  if (job === 'water' && state.recycler === false) return 'Turn on the water recycler.';
  if (job === 'water' && outpostIncident(state)?.type === 'quake' && state.campaign.incident?.resolvedAt === undefined) return 'Inspect the isolated recycler first.';
  if (job === 'crops' && state.water < 1) return 'Needs 1 water.';
  if ((job === 'crops' || job === 'water') && state.battery < 1) return 'Needs 1 power.';
  return '';
}
function assignmentBlock(state: OutpostState, job: Job, plot?: number) {
  if (plot !== undefined && state.facilities.find(f => f.plot === plot)?.enabled === false) return 'Switch the facility back on.';
  return jobInputBlock(state, job);
}
export const jobDuration = (job: Job, id: CrewId) => jobs[job].ticks + (jobs[job].specialist === id ? 0 : 12);

export const resourceNames = { battery: 'power', food: 'food', water: 'water', oxygen: 'oxygen', materials: 'materials' } as const;
export function resourceDeltas(before: Partial<Record<keyof typeof resourceNames, number>>, after: typeof before, suffix = '') {
  return (Object.keys(resourceNames) as (keyof typeof resourceNames)[]).flatMap(key => {
    if (after[key] === undefined) return [];
    const delta = Number((after[key] - (before[key] ?? 0)).toFixed(2));
    return delta ? [`${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${resourceNames[key]}${suffix}`] : [];
  }).join(' · ');
}
function jobResources(state: OutpostState, job: Job) {
  switch (job) {
    case 'power': return state.campaign.upgraded ? { materials: Math.min(materialCapacity, state.materials + 5) } : {};
    case 'crops': return { battery: state.battery - 1, water: state.water - 1, food: Math.min(40, state.food + 4) };
    case 'water': return { battery: state.battery - 1, water: Math.min(30, state.water + 3) };
    default: return {};
  }
}
export function jobPreview(state: OutpostState, job: Job) {
  if (job === 'power' && !state.campaign.upgraded) return '+1 power/day in clear conditions';
  if (jobInputBlock(state, job)) return '';
  return resourceDeltas(state, jobResources(state, job));
}
export function assignJob(state: OutpostState, id: CrewId, job: Job, plot?: number) {
  const blocked = jobBlock(state, id, job, plot);
  if (blocked) return blocked;
  if (job === 'arrayRepair' && !state.campaign.incident!.partsReserved) {
    state.materials -= impactParts;
    state.campaign.incident!.partsReserved = true;
    state.message = `Array repair assigned · −${impactParts} materials. Reserved parts remain on site if you cancel.`;
  }
  state.campaign.workers[id].assignment = { job, plot, progress: 0 };
  return '';
}
function progressJobs(state: OutpostState, atJob: (id: CrewId) => boolean) {
  const campaign = state.campaign;
  for (const member of crew) {
    const worker = campaign.workers[member.id];
    const assignment = worker.assignment;
    if (!assignment || !atJob(member.id) || assignmentBlock(state, assignment.job, assignment.plot)) continue;
    const { job } = assignment;
    if (++assignment.progress < jobDuration(job, member.id)) continue;
    const values = jobResources(state, job);
    const change = resourceDeltas(state, values);
    const previousRates = rates(state);
    Object.assign(state, values);
    switch (job) {
      case 'power': campaign.upgraded = true; break;
      case 'safety': campaign.safetyChecked = true; break;
      case 'arrayRepair':
      case 'recyclerInspection':
        campaign.incident!.resolvedAt = state.elapsed + 1;
        break;
      case 'survey': {
        campaign.surveyed = true;
        const revealed = radarContacts(campaign.rover, locations.survey);
        state.message = revealed.length ? `Tower radar found ${revealed.map(id => cacheSites[id].name).join(', ')}.` : 'Tower radar sweep complete. Use the rover scanner beyond the base.';
        break;
      }
    }
    delete worker.assignment;
    campaign.cooldowns[job] = state.elapsed + 60;
    if (job !== 'survey') {
      const trend = resourceDeltas(previousRates, rates(state), '/day');
      state.message = [`${member.name} completed the job`, change, trend].filter(Boolean).join(' · ');
    }
  }
}

export function crewActivity(state: OutpostState, id: CrewId) {
  const { campaign, sheltered } = state;
  const build = nextBuild(state);
  const builders = activeBuilders(campaign, build?.plot, sheltered);
  const assignment = campaign.workers[id].assignment;
  const activity = workerStatus(campaign, id, sheltered, build?.plot);
  const job = assignment ? jobs[assignment.job].name : '';
  if (campaign.rover.driver === id) return activity === 'In the rover' ? 'Driving rover' : activity;
  if (sheltered) return [activity === 'In shelter' ? 'Sheltered' : activity, job && `Paused · ${job}`].filter(Boolean).join(' · ');
  if (assignment) {
    const blocker = outpostStorm(state) === 'peak'
      ? 'Recall crew to shelter.' : assignmentBlock(state, assignment.job, assignment.plot);
    const remaining = departureCountdown(jobDuration(assignment.job, id) - assignment.progress);
    return blocker ? `Paused · ${job} · ${blocker} · ${remaining} of work left`
      : `${activity.replace('Heading to', 'Walking to')} · ${job} · ${remaining} of work left`;
  }
  if (build && builders.includes(id)) {
    const remaining = departureCountdown(constructionTypes[build.type].seconds - build.progress);
    const teamReady = builders.length === 2 && builders.every(builder => workerStatus(campaign, builder, false, build.plot).startsWith('Working'));
    const status = outpostStorm(state) === 'peak' ? 'Paused · Recall crew to shelter'
      : !activity.startsWith('Working') ? 'Walking to build'
        : teamReady ? 'Building' : 'Waiting for a second builder';
    return `${status} · plot ${build.plot + 1} · ${remaining} of work left`;
  }
  return activity.replace('On duty', 'Available at station').replace('Heading to', 'Available · walking to');
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
const collectionSpeed = .4;
export function cacheCollectionBlock(state: OutpostState, id?: CacheId) {
  const { rover } = state.campaign;
  if (state.outcome !== 'active' || state.campaign.flight || !rover.driver || rover.rescue) return 'Cache collection is unavailable.';
  if (!id || !Object.hasOwn(cacheSites, id) || !rover.contacts.includes(id) || rover.collected.includes(id) || !atDestination(rover, id))
    return 'Scan for a cache and stop within its marked area.';
  if (Math.abs(rover.velocity) > collectionSpeed) return 'Slow down to collect this cache.';
  if (rover.cargo + cacheSites[id].materials > cargoCapacity) return 'Cargo hold too full. Dock to unload first.';
  return '';
}

function atLandmark(state: OutpostState, id: LandmarkId) {
  const [x, z] = state.campaign.rover.position;
  const [lx, lz] = lunarLandmarks[id].point;
  return Math.hypot(x - lx, z - lz) <= landmarkRadius;
}
export function nearbyLandmark(state: OutpostState) {
  return state.campaign.rover.driver ? landmarkIds.find(id => atLandmark(state, id)) : undefined;
}
export function landmarkBlock(state: OutpostState, id: LandmarkId) {
  const { rover } = state.campaign;
  if (state.outcome !== 'active' || state.campaign.flight || !rover.driver) return 'An active rover expedition is required.';
  if (rover.rescue) return 'Wait for the tow to finish.';
  const phase = outpostStorm(state);
  if (state.sheltered || phase === 'warning' || phase === 'peak') return 'Return to the dock for crew safety.';
  if (!Object.hasOwn(lunarLandmarks, id) || !atLandmark(state, id)) return 'Drive within the marked geology area.';
  if (Math.abs(rover.velocity) > collectionSpeed) return 'Slow down to examine.';
  return '';
}
export function visitLandmark(state: OutpostState, id: LandmarkId) {
  const block = landmarkBlock(state, id);
  if (block) return block;
  state.campaign.rover.specimens[id] ??= 'visited';
  return '';
}
export function collectSpecimen(state: OutpostState, id: LandmarkId) {
  const block = landmarkBlock(state, id);
  if (block) return block;
  const { specimens } = state.campaign.rover;
  if (specimens[id] !== 'visited') return 'The specimen must be available in the open exhibit.';
  specimens[id] = 'aboard';
  state.message = `Loaded ${lunarLandmarks[id].sample}. Dock to deliver it to the outpost.`;
  return '';
}

export function roverCommand(state: OutpostState, command: 'board' | 'dock' | 'collect' | 'visit' | 'rescue' | 'charge' | 'scan', driver: CrewId = 'aya', target?: CacheId) {
  if (state.outcome !== 'active' || state.campaign.flight) return 'The surface mission has ended.';
  const { rover, workers } = state.campaign;
  switch (command) {
    case 'board':
      if (state.sheltered || outpostStorm(state) === 'peak' || !isDocked(rover) || !workers[driver] || workers[driver].assignment || rover.charge < 1) return 'Departure requires available crew, battery, and safe conditions.';
      rover.driver = driver; workers[driver].position = rover.position;
      return 'Rover ready. Drive with WASD or the on-screen controls.';
    case 'dock':
      if (isDocked(rover) || rover.rescue || !atDestination(rover, 'dock')) return 'Drive within the marked dock area first.';
      rover.position = locations.dock;
      rover.velocity = rover.steering = 0;
      const before = state.materials;
      state.materials = Math.min(materialCapacity, state.materials + rover.cargo);
      const unloaded = landmarkIds.filter(id => rover.specimens[id] === 'aboard');
      for (const id of unloaded) rover.specimens[id] = 'delivered';
      rover.delivered += rover.cargo; rover.cargo = 0; rover.rescue = 0;
      if (rover.driver) workers[rover.driver].position = locations.dock;
      delete rover.driver;
      const materials = resourceDeltas({ materials: before }, { materials: state.materials });
      return ['Rover docked', materials, unloaded.length ? `${unloaded.length} specimens logged` : ''].filter(Boolean).join(' · ');
    case 'collect': {
      const blocked = cacheCollectionBlock(state, target);
      if (blocked || !target) return blocked;
      const id = target;
      const site = cacheSites[id];
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
    window: departureWindow(state.elapsed),
    docked: isDocked(state.campaign.rover),
    shelterReleased: !state.sheltered,
    stormClear: outpostStorm(state) !== 'peak',
    activeJobs: crew.filter(({ id }) => state.campaign.workers[id].assignment),
    supplies: (Object.keys(shipLoad) as (keyof typeof shipLoad)[]).map(key => ({
      key, available: state[key], required: shipLoad[key],
    })),
  };
}

export function departureChecks(state: OutpostState) {
  const status = departureStatus(state);
  return {
    windowOpen: status.window.open,
    crew: status.docked && status.shelterReleased && status.stormClear && !status.activeJobs.length,
    supplies: status.supplies.every(({ available, required }) => available >= required),
  };
}

export function releaseDepartureJobs(state: OutpostState) {
  if (state.outcome !== 'active' || state.campaign.flight || !departureStatus(state).activeJobs.length) return;
  for (const worker of Object.values(state.campaign.workers)) delete worker.assignment;
  state.message = 'Crew recalled from assigned jobs for departure.';
}

export function launchReturn(state: OutpostState) {
  if (state.outcome !== 'active' || state.campaign.flight || !Object.values(departureChecks(state)).every(Boolean)) return false;
  state.materials -= shipLoad.materials; state.battery -= shipLoad.battery;
  state.oxygen -= shipLoad.oxygen; state.food -= shipLoad.food;
  state.campaign.flight = { stage: 0, fuel: 6, battery: 8, oxygen: 6, departureTick: state.elapsed };
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
  const storm = outpostStorm(state) === 'peak';
  const incident = outpostIncident(state);
  const disruption = incident?.resolvedAt === undefined ? incident?.type : undefined;
  const solarDamage = disruption === 'impact' ? 2 : disruption === 'dust' ? 1.5 : 0;
  const recyclerOff = state.recycler === false || disruption === 'quake';
  const solarOutput = (6 + Number(state.campaign.upgraded) + count('solar') * 5 - solarDamage) * (storm ? .3 : 1);
  const greenhouses = state.growLights === false ? 0 : count('greenhouse');
  return { solarOutput, battery: solarOutput - 5 + Number(recyclerOff) + Number(state.reserveAir === true) - greenhouses * 2 - Number(state.sheltered),
    food: (state.battery > 0 && state.water > 0 ? greenhouses * 3 : 0) - 2, water: (recyclerOff ? -1 : .8) - greenhouses * .5,
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
  state.message = `${constructionTypes[type].name} queued · −${constructionTypes[type].cost} materials · ${departureCountdown(constructionTypes[type].seconds)} of work after the crew arrives.`;
}
// One simulated second per step, independent of rendering and playback speed.
export function stepOutpost(state: OutpostState, drive?: DriveInput): boolean {
  if (state.outcome !== 'active' || state.campaign.flight) return false;
  const { campaign } = state;
  const previousWindow = departureWindow(state.elapsed);
  const oldPhase = outpostStorm(state);
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
    state.message = `Rover recovery complete. ${roverCommand(state, 'dock')}.`;
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
  const phase = outpostStorm(state);
  let alert = phase !== oldPhase;
  if (alert) state.message = phase === 'warning' ? 'Particle warning. Recall the crew and return any rover to the dock.'
    : phase === 'peak' ? 'Storm has arrived. Keep the crew sheltered; outdoor construction is suspended.'
    : 'Storm passed. Crew can return to work. Resume work and prepare for departure.';
  if (campaign.hazards?.incident.tick === state.elapsed) {
    campaign.incident = { acknowledged: false };
    state.message = `${lunarIncidents[campaign.hazards.incident.type].title}. Review the equipment alert.`;
    alert = true;
  }
  if (state.battery === 0 && previousBattery > 0 && flow.battery < 0 && !alert) {
    alert = true; state.message = 'Battery exhausted. Oxygen reserves are being consumed. Add solar capacity.';
  }
  if (state.food <= 0 || state.water <= 0 || state.oxygen <= 0 || exposed) {
    state.outcome = 'failed'; const depleted = (['food', 'water', 'oxygen'] as const).filter(resource => state[resource] <= 0);
    state.message = exposed
      ? `Mission interrupted: ${outside} crew outside shelter when the storm hit.`
      : `Mission interrupted: the outpost ran out of ${depleted.join(', ')}.`; alert = true;
  } else {
    const window = departureWindow(state.elapsed);
    if (window.open !== previousWindow.open) {
      state.message = window.open
        ? `Departure window open. Board within ${departureCountdown(window.closeTick - state.elapsed)}.`
        : `Window missed. Next opening is ${missionDay(window.nextOpening)}, in ${departureCountdown(window.nextOpening - state.elapsed)}.`;
      alert = true;
    }
  }
  return alert;
}
export function parseOutpost(raw: string): OutpostState | undefined {
  try {
    const s = JSON.parse(raw) as OutpostState;
    if (s.version !== 1 || !Number.isInteger(s.elapsed) || s.elapsed < 0 || s.elapsed > 1e7 || typeof s.sheltered !== 'boolean'
      || !['active', 'ready', 'failed'].includes(s.outcome) || typeof s.message !== 'string' || s.message.length > 500
      || !Array.isArray(s.facilities) || s.facilities.length > plots.length) return;
    if (s.training !== undefined && (!s.training || typeof s.training.forecastChecked !== 'boolean' || typeof s.training.complete !== 'boolean')) return;
    if (!s.facilities.every(f => f && Object.hasOwn(constructionTypes, f.type) && Number.isInteger(f.plot) && f.plot >= 0 && f.plot < plots.length
      && Number.isInteger(f.progress) && f.progress >= 0 && f.progress <= constructionTypes[f.type].seconds)
      || new Set(s.facilities.map(f => f.plot)).size !== s.facilities.length) return;
    if ([s.growLights, s.recycler, s.reserveAir, ...s.facilities.map(f => f.enabled)].some(value => value !== undefined && typeof value !== 'boolean')) return;
    if (s.campaign === undefined) {
      s.campaign = newCampaign(s.sheltered);
      if (s.outcome === 'ready') {
        s.outcome = 'active';
        s.message = 'Your outpost is established. Check Departure for the next boarding window.';
      }
    }
    if (s.campaign?.rover) migrateRover(s.campaign);
    if (!validCampaign(s.campaign) || (s.outcome === 'ready') !== (s.campaign.flight?.stage === returnSteps.length)) return;
    const { hazards, incident, workers } = s.campaign;
    if (!!incident !== (!!hazards && s.elapsed >= hazards.incident.tick) || (incident?.resolvedAt ?? 0) > s.elapsed) return;
    if (Object.values(workers).some(({ assignment }) => {
      if (assignment?.job !== 'arrayRepair' && assignment?.job !== 'recyclerInspection') return false;
      return !incident || !hazards || incident.resolvedAt !== undefined || lunarIncidents[hazards.incident.type].job !== assignment.job
        || assignment.plot !== undefined || assignment.job === 'arrayRepair' && !incident.partsReserved;
    })) return;
    const departureTick = s.campaign.flight?.departureTick;
    if (departureTick !== undefined && departureTick !== s.elapsed) return;
    const limits = { battery: rates(s).capacity, food: 40, water: 30, oxygen: 20, materials: materialCapacity };
    for (const key of Object.keys(limits) as (keyof typeof limits)[]) if (!Number.isFinite(s[key]) || s[key] < 0 || s[key] > limits[key]) return;
    return s;
  } catch { return; }
}

// One mission day takes 60 real seconds at 1×. Keep fixed ticks for old save compatibility.
export { ticksPerDay };
export function missionDay(elapsed: number) { return `Day ${(1 + elapsed / ticksPerDay).toFixed(2)}`; }
export function daysRemaining(ticks: number) { return `${Math.max(0, ticks / ticksPerDay).toFixed(2)} days`; }
export function departureCountdown(ticks: number) {
  if (ticks >= ticksPerDay) return daysRemaining(ticks);
  return `${ticks} sim ${ticks === 1 ? 'second' : 'seconds'}`;
}
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
    { label: 'Survival & return', points: Math.round(25 * percent(state.elapsed, firstDepartureTick)) + (state.outcome === 'ready' ? 15 : 0), max: 40, detail: 'Up to 25 for reaching the first window on Day 13 and 15 for safe splashdown.' },
    { label: 'Outpost reserves', points: Math.round(reservePoints), max: 25, detail: 'Up to 5 each for 12 power, 8 food, 10 water, 8 oxygen, and 15 materials remaining at the base after ship loading.' },
    { label: 'Sustainable operations', points: 5 * [flow.battery, flow.food, flow.water].filter(rate => rate >= 0).length, max: 15, detail: '5 each for steady or increasing power, food, and water.' },
    { label: 'Exploration', points: Math.round(12 * percent(state.campaign.rover.delivered, explorationMaterialTarget)) + (state.campaign.rover.heritage ? 8 : 0), max: 20, detail: 'Up to 12 for delivering 150 cache materials and 8 for visiting the Apollo 12 overlook.' },
  ];
  const total = categories.reduce((sum, category) => sum + category.points, 0);
  const rating = total >= 90 ? 'Exceptional' : total >= 75 ? 'Strong' : total >= 60 ? 'Solid' : 'Needs improvement';
  return { total, rating, categories };
}
