export const shiftCount = 2;
export const harvestTarget = 3;
export const resourceLimits = { battery: 11, air: 3, harvest: 4 };

export const scenarios = {
  standard: { name: 'First storm', battery: 11, peakPower: 1, peakReserve: 1 },
  lowPower: { name: 'Low battery challenge', battery: 10, peakPower: 1, peakReserve: 1 },
} as const;
export type Scenario = keyof typeof scenarios;

export const airSettings = {
  normal: { power: 2, reserveUsed: 0 },
  reserve: { power: 1, reserveUsed: 2 },
};
export const lightSettings = {
  off: { power: 0, growth: 0 },
  dim: { power: 1, growth: 1 },
  full: { power: 3, growth: 2 },
};

export interface ShiftPlan {
  location: 'shelter' | 'standard';
  airMode: keyof typeof airSettings;
  lights: keyof typeof lightSettings;
}
export const defaultPlan: ShiftPlan = { location: 'shelter', airMode: 'normal', lights: 'dim' };
export const phaseLabel = { warning: 'Warning', rising: 'Rising', peak: 'Peak', recovery: 'Recovery' } as const;
export type Phase = keyof typeof phaseLabel;
export type Outcome = 'active' | 'secured' | 'delayed' | 'exposure' | 'air';

export interface MissionState {
  scenario: Scenario;
  phase: Phase;
  completedShifts: number;
  battery: number;
  air: number;
  harvest: number;
  crew: 'habitat' | ShiftPlan['location'];
  lights: ShiftPlan['lights'];
  outcome: Outcome;
}

export function startMission(scenario: Scenario = 'standard'): MissionState {
  return {
    scenario, phase: 'warning', completedShifts: 0, battery: scenarios[scenario].battery,
    air: resourceLimits.air, harvest: 0, crew: 'habitat', lights: 'dim', outcome: 'active',
  };
}

export function shiftDemand(state: MissionState, shift = state.completedShifts) {
  const rules = scenarios[state.scenario];
  return { addedPower: shift === 1 ? rules.peakPower : 0, addedAir: shift === 1 ? rules.peakReserve : 0 };
}

export function projectShift(state: MissionState, plan: ShiftPlan) {
  const { addedPower, addedAir } = shiftDemand(state);
  const air = airSettings[plan.airMode];
  const lights = lightSettings[plan.lights];
  const protectedCrew = plan.location === 'shelter';
  const airUsed = air.reserveUsed + (plan.airMode === 'reserve' ? addedAir : 0);
  const powerUsed = air.power + addedPower + lights.power + Number(protectedCrew);
  return {
    phase: state.completedShifts === 0 ? 'rising' as const : 'peak' as const,
    powerUsed, airPower: air.power + addedPower, lightPower: lights.power, airUsed,
    affordable: powerUsed <= state.battery, protectedCrew,
    battery: state.battery - powerUsed, air: Math.max(0, state.air - airUsed),
    harvest: state.harvest + lights.growth, growth: lights.growth,
  };
}
export type ShiftProjection = ReturnType<typeof projectShift>;

export function commitShift(state: MissionState, plan: ShiftPlan) {
  const result = projectShift(state, plan);
  if (state.outcome !== 'active' || !result.affordable) return;
  const completedShifts = state.completedShifts + 1;
  const outcome: Outcome = !result.air ? 'air' : !result.protectedCrew ? 'exposure'
    : completedShifts < shiftCount ? 'active'
      : result.harvest >= harvestTarget ? 'secured' : 'delayed';
  const next: MissionState = {
    ...state, phase: result.phase, completedShifts, outcome,
    battery: result.battery, air: result.air, harvest: result.harvest,
    crew: plan.location, lights: plan.lights,
  };
  return { next, result };
}

export function recover(state: MissionState): MissionState {
  return state.outcome === 'secured' || state.outcome === 'delayed'
    ? { ...state, phase: 'recovery', crew: 'habitat' } : state;
}

export type MissionEvent =
  | { type: 'arrival' | 'warning' | 'forecast' }
  | { type: 'shift'; previous: MissionState; state: MissionState; result: ShiftProjection; duration: number }
  | { type: 'settled' | 'debrief' | 'reset'; state: MissionState }
  | { type: 'recovery'; state: MissionState; duration: number };

export type PresentMissionEvent = (event: MissionEvent) => void;
