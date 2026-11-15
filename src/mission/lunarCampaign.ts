import { cacheIds, cacheSites, groundSlope, roverBounds, tractionAt, travelCost, type CacheId } from './lunarSurface.ts';
import { crew, type CrewId } from '../data/crew.ts';
import { stormSchedule, validHazards, type HazardSchedule, type IncidentState } from './lunarHazards.ts';
import { landmarkIds, type LandmarkId, type SpecimenStatus } from '../data/lunarLandmarks.ts';
export { stormSchedule };

export const plots = [[-12, -5], [-7, -7], [7, -7], [12, -5], [-10, 7], [10, 7]] as const;
export type Point = readonly [number, number];
export const shelter: Point = [0, -2.8];
export const locations = {
  power: [0, 2.8], crops: [-5.8, 2.5], water: [4.2, -3.1],
  safety: shelter, survey: [6.1, 2.4], arrayRepair: [0, 2.8], recyclerInspection: [4.2, -3.1],
  dock: [5, 9], cache: [19, 13], heritage: [-19, 12],
} as const satisfies Record<string, Point>;

export const jobs = {
  power: { name: 'Service power equipment', reward: '+1 power/day on first service, then 5 materials', ticks: 30, specialist: 'aya' },
  crops: { name: 'Harvest a crop batch', reward: '+4 food', ticks: 36, specialist: 'imani' },
  water: { name: 'Tune the recycler', reward: '+3 water', ticks: 27, specialist: 'mateo' },
  safety: { name: 'Run a shelter inspection', reward: 'Earlier storm warnings', ticks: 20, specialist: 'leena' },
  survey: { name: 'Survey for supplies', reward: 'Scan nearby terrain for supply caches', ticks: 25, specialist: 'noah' },
  arrayRepair: { name: 'Repair damaged array', reward: 'Restore the damaged section', ticks: 30, specialist: 'aya' },
  recyclerInspection: { name: 'Inspect isolated recycler', reward: 'Lift isolation and restore water recycling', ticks: 24, specialist: 'mateo' },
} as const;
export type Job = keyof typeof jobs;
export const defaultStations: Record<CrewId, Job> = { aya: 'power', imani: 'crops', mateo: 'water', leena: 'safety', noah: 'survey' };
const crewIds = crew.map(member => member.id);
const near = (a: Point, b: Point, distance = .2) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= distance;
export interface Assignment { job: Job; progress: number; plot?: number }
export interface Worker { position: Point; assignment?: Assignment }
export interface Rover {
  position: Point; heading: number; charge: number; driver?: CrewId;
  cargo: number; delivered: number; heritage: boolean; rescue: number;
  contacts: CacheId[]; collected: CacheId[]; velocity: number; steering: number; radarReady: number;
  specimens: Partial<Record<LandmarkId, SpecimenStatus>>;
}
export type DriveInput = { throttle: number; turn: number };
export const idleDrive: DriveInput = { throttle: 0, turn: 0 };
export const roverCapacity = 30;
export const cargoCapacity = 60;
export const materialCapacity = 200;
export const ticksPerDay = 60;
const departureCycleTicks = 15 * ticksPerDay;
export const firstDepartureTick = 12 * ticksPerDay;

export function departureWindow(elapsed: number) {
  const cycleStart = Math.floor(elapsed / departureCycleTicks) * departureCycleTicks;
  const openTick = cycleStart + firstDepartureTick;
  const closeTick = cycleStart + departureCycleTicks;
  const open = elapsed >= openTick;
  return {
    cycle: cycleStart / departureCycleTicks + 1,
    open, openTick, closeTick,
    nextOpening: open ? closeTick + firstDepartureTick : openTick,
  };
}
export const shipLoad = { materials: 15, battery: 8, oxygen: 6, food: 5 } as const;
export const returnSteps = [
  { title: 'Lunar liftoff', instruction: 'Confirm the ascent path is clear, then launch.', choices: ['Launch into lunar orbit', 'Descend toward the surface'], correct: 0, cost: [2, 1, 1] },
  { title: 'Earth-bound burn', instruction: 'Point along the Earth transfer corridor before spending fuel.', choices: ['Burn toward the Moon', 'Burn along the Earth transfer corridor'], correct: 1, cost: [3, 1, 1] },
  { title: 'Earth reentry', instruction: 'Put the heat shield between the cabin and the incoming airflow.', choices: ['Align heat shield forward', 'Align cabin windows forward'], correct: 0, cost: [0, 1, 1] },
  { title: 'Parachute deployment', instruction: 'Wait for the indicated safe deployment window after atmospheric braking.', choices: ['Deploy before atmospheric braking', 'Deploy at the safe window'], correct: 1, cost: [0, 1, 0] },
  { title: 'Ocean splashdown', instruction: 'Confirm the recovery beacon and secure the capsule.', choices: ['Activate recovery beacon', 'Switch off communications'], correct: 0, cost: [0, 1, 0] },
] as const;
export interface ReturnFlight { stage: number; fuel: number; battery: number; oxygen: number; departureTick?: number }
export interface Campaign {
  workers: Record<CrewId, Worker>; cooldowns: Partial<Record<Job, number>>;
  upgraded: boolean; safetyChecked: boolean; surveyed: boolean;
  rover: Rover; flight?: ReturnFlight;
  stormAcknowledged?: number[];
  hazards?: HazardSchedule;
  incident?: IncidentState;
}

export function newCampaign(sheltered = false): Campaign {
  const workers = Object.fromEntries(crewIds.map(id => [id, { position: sheltered ? shelter : locations[defaultStations[id]] }])) as Campaign['workers'];
  return { workers, cooldowns: {}, upgraded: false, safetyChecked: false, surveyed: false,
    rover: { position: locations.dock, heading: Math.PI / 2, charge: roverCapacity, cargo: 0, contacts: [], collected: [], delivered: 0, heritage: false, rescue: 0, velocity: 0, steering: 0, radarReady: 0, specimens: {} } };
}

export function campaignStorm(elapsed: number, earlier = false, schedule?: HazardSchedule) {
  const window = stormSchedule(elapsed, earlier, schedule);
  if (window && elapsed >= window.start) return 'peak';
  if (window && elapsed >= window.warning) return 'warning';
  return window?.id === 1 ? 'clear' : 'recovery';
}

export const isDocked = (rover: Rover) => !rover.driver;
export const atDestination = (rover: Rover, destination: 'dock' | 'heritage' | CacheId) =>
  near(rover.position, destination === 'dock' || destination === 'heritage' ? locations[destination] : cacheSites[destination].point, 2.4);
export const shelteredCount = (campaign: Campaign, recalling: boolean) => recalling
  ? crewIds.filter(id => campaign.rover.driver !== id && near(campaign.workers[id].position, shelter)).length : 0;

export function activeBuilders(campaign: Campaign, plot: number | undefined, recalling: boolean): CrewId[] {
  if (plot === undefined || recalling) return [];
  const preferred: CrewId[] = ['aya', 'leena', 'mateo', 'imani', 'noah'];
  return preferred.filter(id => !campaign.workers[id].assignment && campaign.rover.driver !== id).slice(0, 2);
}

function advancePosition(from: Point, to: Point): Point {
  const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
  if (distance <= 1.5) return to;
  return [from[0] + (to[0] - from[0]) * 1.5 / distance, from[1] + (to[1] - from[1]) * 1.5 / distance];
}

export function workerTarget(campaign: Campaign, id: CrewId, recalling: boolean, plot?: number, builders: CrewId[] = []): Point {
  if (campaign.rover.driver === id) return campaign.rover.position;
  if (recalling) return shelter;
  const assignment = campaign.workers[id].assignment;
  if (builders.includes(id) && plot !== undefined) {
    const [x, z] = plots[plot];
    return [x + (builders[0] === id ? -1.5 : 1.5), z + .8];
  }
  if (assignment?.plot !== undefined) {
    const [x, z] = plots[assignment.plot];
    return [x + 1.6, z + .8];
  }
  return locations[assignment?.job ?? defaultStations[id]];
}

export function stepWorkers(campaign: Campaign, recalling: boolean, plot?: number) {
  const builders = activeBuilders(campaign, plot, recalling);
  for (const id of crewIds) {
    const target = workerTarget(campaign, id, recalling, plot, builders);
    campaign.workers[id].position = campaign.rover.driver === id ? target : advancePosition(campaign.workers[id].position, target);
  }
  return {
    builders, building: builders.length === 2 && builders.every(id => near(campaign.workers[id].position, workerTarget(campaign, id, recalling, plot, builders))),
    atJob: (id: CrewId) => near(campaign.workers[id].position, workerTarget(campaign, id, recalling, plot, builders)),
  };
}

export function workerStatus(campaign: Campaign, id: CrewId, recalling: boolean, plot?: number) {
  if (campaign.rover.driver === id) return campaign.rover.rescue ? 'Awaiting rover recovery' : 'In the rover';
  const builders = activeBuilders(campaign, plot, recalling);
  const worker = campaign.workers[id];
  const there = near(worker.position, workerTarget(campaign, id, recalling, plot, builders));
  if (recalling) return there ? 'In shelter' : 'Returning to shelter';
  const job = worker.assignment?.job ?? defaultStations[id];
  const station = builders.includes(id) ? `construction plot ${(plot ?? 0) + 1}` : worker.assignment?.plot !== undefined ? `plot ${worker.assignment.plot + 1}` : { power: 'power station', crops: 'farm', water: 'recycler', safety: 'tower', survey: 'comms', arrayRepair: 'solar array', recyclerInspection: 'recycler' }[job];
  return there ? (builders.includes(id) || worker.assignment ? `Working · ${station}` : `On duty · ${station}`) : `Heading to ${station}`;
}

/** Vehicle physics use fixed substeps, independent of the one-second mission rules. */
export const driveStep = 1 / 60;
export function stepRover(rover: Rover, input: DriveInput, seconds = 1) {
  if (!rover.driver || rover.rescue || !rover.charge) {
    rover.velocity = rover.steering = 0;
    return;
  }
  for (let remaining = seconds; remaining > 1e-8; remaining -= driveStep) {
    const dt = Math.min(remaining, driveStep);
    const { heading } = rover;
    const [x,z] = rover.position;
    const grip = tractionAt(x,z);
    const sign = Math.sign(input.throttle);
    const slope = groundSlope(x,z,heading) * sign;
    const speed = (sign >= 0 ? 4.1 : 2.3) * (.55 + .45*grip) * Math.max(.53, 1 - Math.max(0,slope)*.52);
    const targetVelocity = input.throttle * speed;
    const response = input.throttle === 0 ? 6 : 3.2;
    rover.velocity += (targetVelocity - rover.velocity) * (1 - Math.exp(-dt * response));
    if (Math.abs(rover.velocity) < .03 && !input.throttle) rover.velocity = 0;
    rover.steering += (input.turn - rover.steering) * (1 - Math.exp(-dt * 12));
    // Low-speed pivoting keeps tight docking maneuvers usable on keyboard and touch.
    const steerRate = (.8 + .55 * Math.min(1,Math.abs(rover.velocity) / 1.7)) * (.68 + .32*grip);
    const reverse = rover.velocity < -.12 ? -1 : 1;
    rover.heading = (heading + rover.steering * steerRate * reverse * dt) % (2*Math.PI);
    const unitCost = travelCost(x,z,rover.heading + (rover.velocity < 0 ? Math.PI : 0));
    const distance = Math.sign(rover.velocity) * Math.min(Math.abs(rover.velocity) * dt, rover.charge / unitCost);
    const nextX = Math.max(roverBounds.left,Math.min(roverBounds.right,x + Math.sin(rover.heading)*distance));
    const nextZ = Math.max(roverBounds.top,Math.min(roverBounds.bottom,z + Math.cos(rover.heading)*distance));
    const moved = Math.hypot(nextX-x,nextZ-z);
    rover.position = [nextX,nextZ];
    rover.charge = Math.max(0,rover.charge - moved*unitCost);
    if (rover.charge <= 1e-7 || (Math.abs(distance) > .01 && moved < .002)) {
      rover.velocity = 0;
      if (rover.charge <= 1e-7) rover.charge = 0;
      break;
    }
  }
}

export function migrateRover(campaign: Campaign) {
  const rover = campaign.rover as Rover & { cacheLoaded?: boolean };
  if (rover.specimens === undefined) rover.specimens = {};
  if (rover.contacts === undefined && rover.collected === undefined) {
    rover.contacts = campaign.surveyed || rover.cacheLoaded ? ['cache'] : [];
    rover.collected = rover.cacheLoaded === true ? ['cache'] : [];
    rover.velocity = rover.steering = rover.radarReady = 0;
    delete rover.cacheLoaded;
  }
}

export function advanceReturn(flight: ReturnFlight, choice: number) {
  const step = returnSteps[flight.stage];
  if (!step) return 'Return flight is complete.';
  if (choice !== step.correct) return 'Command held. Check the guidance and try again.';
  const [fuel, battery, oxygen] = step.cost;
  if (flight.fuel < fuel || flight.battery < battery || flight.oxygen < oxygen) return 'Insufficient return reserves.';
  flight.fuel -= fuel;
  flight.battery -= battery;
  flight.oxygen -= oxygen;
  flight.stage++;
}

function validPoint(point: Point) {
  return Array.isArray(point) && point.length === 2 && point.every(value => Number.isFinite(value) && Math.abs(value) <= 56);
}

export function validCampaign(c: Campaign) {
  if (!c || !c.workers || !c.rover || !c.cooldowns || [c.upgraded, c.safetyChecked, c.surveyed].some(value => typeof value !== 'boolean')) return false;
  if (c.hazards !== undefined && !validHazards(c.hazards)) return false;
  if (c.incident !== undefined && (!c.hazards || !c.incident || typeof c.incident.acknowledged !== 'boolean'
    || c.incident.partsReserved !== undefined && (c.incident.partsReserved !== true || c.hazards.incident.type !== 'impact')
    || c.incident.resolvedAt !== undefined && (!Number.isInteger(c.incident.resolvedAt) || c.incident.resolvedAt < c.hazards.incident.tick))) return false;
  const acknowledged = c.stormAcknowledged;
  if (acknowledged !== undefined && (!Array.isArray(acknowledged) || new Set(acknowledged).size !== acknowledged.length
    || acknowledged.some(id => id !== 1 && id !== 2))) return false;
  if (!crewIds.every(id => {
    const worker = c.workers[id];
    if (!worker || !validPoint(worker.position)) return false;
    const a = worker.assignment;
    return a === undefined || a && Object.hasOwn(jobs, a.job) && Number.isInteger(a.progress) && a.progress >= 0 && a.progress < jobs[a.job].ticks + 12
      && (a.plot === undefined || Number.isInteger(a.plot) && a.plot >= 0 && a.plot < plots.length);
  })) return false;
  if (Object.entries(c.cooldowns).some(([job, tick]) => !Object.hasOwn(jobs, job) || !Number.isInteger(tick) || tick < 0)) return false;
  const r = c.rover;
  if (!validPoint(r.position) || !Number.isFinite(r.heading) || !Number.isFinite(r.charge) || r.charge < 0 || r.charge > roverCapacity
    || r.driver !== undefined && !crewIds.includes(r.driver) || !Number.isInteger(r.cargo) || r.cargo < 0 || r.cargo > cargoCapacity
    || !Number.isInteger(r.delivered) || r.delivered < 0 || !Number.isFinite(r.velocity) || Math.abs(r.velocity) > 4.2
    || !Number.isFinite(r.steering) || Math.abs(r.steering) > 1 || !Number.isInteger(r.radarReady) || r.radarReady < 0
    || !Number.isInteger(r.rescue) || r.rescue < 0 || r.rescue > 20 || typeof r.heritage !== 'boolean') return false;
  const validIds = (ids: CacheId[]) => Array.isArray(ids) && new Set(ids).size === ids.length && ids.every(id => cacheIds.includes(id));
  if (!validIds(r.contacts) || !validIds(r.collected) || !r.collected.every(id => r.contacts.includes(id))) return false;
  if (!r.specimens || typeof r.specimens !== 'object' || Array.isArray(r.specimens)
    || Object.entries(r.specimens).some(([id, status]) => !landmarkIds.includes(id as LandmarkId) || !['visited', 'aboard', 'delivered'].includes(status)
      || status === 'aboard' && !r.driver)) return false;
  if (r.cargo + r.delivered !== r.collected.reduce((sum,id) => sum + cacheSites[id].materials,0)) return false;
  if (!r.driver && (!near(r.position, locations.dock) || r.rescue || r.cargo || r.velocity || r.steering)) return false;
  if (r.driver && c.workers[r.driver].assignment) return false;
  if (c.flight) {
    const f = c.flight;
    if (!Number.isInteger(f.stage) || f.stage < 0 || f.stage > returnSteps.length) return false;
    if (f.departureTick !== undefined && (!Number.isInteger(f.departureTick) || f.departureTick < 0 || !departureWindow(f.departureTick).open)) return false;
    const spent = returnSteps.slice(0, f.stage).reduce(([a,b,d], step) => [a+step.cost[0], b+step.cost[1], d+step.cost[2]], [0,0,0]);
    return f.fuel === 6-spent[0] && f.battery === 8-spent[1] && f.oxygen === 6-spent[2];
  }
  return c.flight === undefined;
}
