import { freshCrew, isAssignments, resting, type Assignments, type Readiness } from '../data/crew.ts';
import { resolveCrew, type Controller } from './crewOperations.ts';

export const lunarTraining = {
  id: 'lunar-training',
  days: 7,
  crewSize: 5,
  generation: [7, 8, 6, 5, 7, 8, 7],
  stormStart: 3,
  capacity: { battery: 16, air: 3, water: 10 },
  startingFood: 12,
  foodPerDay: 2,
  waterPerDay: 1,
  recoveryPower: 1,
  recoveredWater: 2,
  cropTarget: 6,
  harvestFood: 4,
  readiness: { battery: 4, food: 2 },
} as const;

export const scenarios = {
  standard: { battery: 10 },
  lowPower: { battery: 7 },
} as const;

export type Scenario = keyof typeof scenarios;
export const lightSettings = {
  off: { label: 'Off', power: 0, growth: 0 },
  low: { label: 'Low', power: 1, growth: 1 },
  full: { label: 'Full', power: 3, growth: 2 },
} as const;

export interface DailyPlan {
  location: 'shelter' | 'habitat';
  airMode: 'normal' | 'reserve';
  lights: keyof typeof lightSettings;
  recovery: boolean;
  assignments: Assignments;
}

export const defaultPlan: DailyPlan = { location: 'habitat', airMode: 'normal', lights: 'low', recovery: true, assignments: resting };

export type StormPhase = 'clear' | 'warning' | 'rising' | 'peak' | 'recovery';
export type Hazard = 'exposure' | 'air' | 'power' | 'food' | 'water';
export type Outcome = 'active' | 'ready' | 'shortfall' | 'interrupted';

export interface MissionState {
  scenario: Scenario;
  completedDays: number;
  battery: number;
  air: number;
  water: number;
  wastewater: number;
  food: number;
  crop: number;
  harvests: number;
  readiness: Readiness;
  controller: Controller;
  lastPlan: DailyPlan;
  outcome: Outcome;
}

export function startMission(scenario: Scenario): MissionState {
  return {
    scenario, completedDays: 0, battery: scenarios[scenario].battery,
    air: lunarTraining.capacity.air, water: 8, wastewater: 2, food: lunarTraining.startingFood, crop: 0, harvests: 0,
    readiness: { ...freshCrew }, controller: 'uninspected',
    lastPlan: { ...defaultPlan, assignments: { ...resting } }, outcome: 'active',
  };
}

export function stormPhase(day: number): StormPhase {
  const relativeDay = day - lunarTraining.stormStart;
  if (relativeDay === -1) return 'warning';
  if (relativeDay === 0) return 'rising';
  if (relativeDay === 1) return 'peak';
  if (relativeDay === 2) return 'recovery';
  return 'clear';
}

export function hasParticleRisk(phase: StormPhase) {
  return phase === 'rising' || phase === 'peak';
}

export function isDailyPlan(value: unknown): value is DailyPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Partial<DailyPlan>;
  return (plan.location === 'shelter' || plan.location === 'habitat')
    && (plan.airMode === 'normal' || plan.airMode === 'reserve')
    && typeof plan.lights === 'string' && Object.hasOwn(lightSettings, plan.lights)
    && typeof plan.recovery === 'boolean' && isAssignments(plan.assignments);
}

// Support and food are needed before the solar charging window. Later charging
// cannot reverse a shortage that occurred in the first part of the day.
export function forecastPower(day: number, controller: Controller) {
  const base = lunarTraining.generation[day - 1];
  return base === undefined ? 0 : base + Number(controller === 'repaired');
}

export function previewDay(state: MissionState, plan: DailyPlan) {
  const rules = lunarTraining;
  const day = state.completedDays + 1;
  const phase = stormPhase(day);
  const operations = resolveCrew(state, plan, hasParticleRisk(phase));
  const generation = forecastPower(day, state.controller);
  const peak = phase === 'peak' ? 1 : 0;
  const reserve = plan.airMode === 'reserve';
  const airPower = (reserve ? 1 : 2) + peak;
  const airDemand = reserve ? 2 + peak : 0;
  const shelterPower = plan.location === 'shelter' ? 1 : 0;
  const essentialPower = 1 + airPower + shelterPower;
  const essentialShortfall = Math.max(0, essentialPower - state.battery);
  const afterEssentials = Math.max(0, state.battery - essentialPower);
  const charged = Math.min(rules.capacity.battery, afterEssentials + generation);
  const lostGeneration = afterEssentials + generation - charged;
  const lights = lightSettings[plan.lights];
  const recoveryPower = plan.recovery && !operations.tunedRecycler ? rules.recoveryPower : 0;
  const optionalDemand = recoveryPower + lights.power;
  const powerGap = Math.max(0, optionalDemand - charged);
  const airUsed = Math.min(state.air, airDemand);
  const lit = charged >= optionalDemand;
  const drinkingWater = Math.min(state.water, rules.waterPerDay);
  const wastewater = state.wastewater + drinkingWater;
  const afterDrinking = state.water - drinkingWater;
  const recovered = plan.recovery && charged >= recoveryPower
    ? Math.min(rules.recoveredWater + operations.recoveryBonus, wastewater, rules.capacity.water - afterDrinking) : 0;
  const availableWater = afterDrinking + recovered;
  const irrigated = lit && lights.growth > 0 && availableWater >= 1;
  const growth = irrigated ? lights.growth + operations.extraGrowth : 0;
  const cropProgress = state.crop + growth;
  const cropMature = cropProgress >= rules.cropTarget;
  const eaten = Math.min(state.food, rules.foodPerDay);
  const hazards: Hazard[] = [];
  if (hasParticleRisk(phase) && plan.location !== 'shelter') hazards.push('exposure');
  if (essentialShortfall) hazards.push('power');
  if (airUsed < airDemand) hazards.push('air');
  if (eaten < rules.foodPerDay) hazards.push('food');
  if (drinkingWater < rules.waterPerDay) hazards.push('water');
  const harvest = hazards.length === 0 && cropMature ? rules.harvestFood : 0;

  const next: MissionState = {
    ...state, completedDays: day,
    battery: Math.max(0, charged - optionalDemand),
    air: state.air - airUsed,
    water: availableWater - Number(irrigated),
    wastewater: wastewater - recovered,
    food: state.food - eaten + harvest,
    crop: harvest ? 0 : Math.min(cropProgress, rules.cropTarget - 1),
    harvests: state.harvests + Number(harvest > 0),
    readiness: operations.readiness,
    controller: operations.controller,
    lastPlan: { ...plan, assignments: { ...plan.assignments } },
    outcome: 'active',
  };
  if (hazards.length) next.outcome = 'interrupted';
  else if (day === rules.days) {
    next.outcome = next.food >= rules.readiness.food && next.battery >= rules.readiness.battery ? 'ready' : 'shortfall';
  }

  return {
    day, phase, next, generation, lostGeneration, essentialPower, recoveryPower, powerGap,
    airPower, airUsed, lightPower: lights.power, growth, harvest, recovered, eaten, hazards, operations,
  };
}

export type DayResult = ReturnType<typeof previewDay>;

export function commitDay(state: MissionState, plan: DailyPlan, expectedDay: number) {
  if (state.outcome !== 'active' || state.completedDays + 1 !== expectedDay || expectedDay > lunarTraining.days || !isDailyPlan(plan)) return;
  if (expectedDay === 1 && !plan.recovery) return;
  const result = previewDay(state, plan);
  if (!result.powerGap && !Object.keys(result.operations.errors).length) return result;
}
