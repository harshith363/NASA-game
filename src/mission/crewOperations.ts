import { crew, crewCost, crewTasks, maxReadiness, type CrewId, type CrewTask } from '../data/crew.ts';
import type { DailyPlan, MissionState } from './dailyMission.ts';

export type Controller = 'uninspected' | 'diagnosed' | 'partly-repaired' | 'repaired';

export function assignmentRestrictions(state: MissionState, plan: DailyPlan, task: CrewTask, particleRisk: boolean) {
  if (crewTasks[task].outside && (particleRisk || plan.location === 'shelter')) return 'Requires outside work from the habitat on a day with no particle risk.';
  if (task === 'inspect' && state.controller !== 'uninspected') return 'The controller has already been inspected.';
  if (task === 'repair' && state.controller === 'uninspected') return 'Inspect the controller on an earlier day.';
  if (task === 'repair' && state.controller === 'repaired') return 'The controller is already repaired.';
  if (task === 'grow' && plan.lights === 'off') return 'Turn on grow lights first.';
  if (task === 'recycle' && (state.completedDays === 0 || !plan.recovery)) return 'Available from day two with water recovery on.';
  if (task === 'safety' && plan.location !== 'shelter') return 'Choose the shelter first.';
  if (task === 'radio' && state.completedDays >= 6) return 'There are no further training days to forecast.';
  return '';
}

export function resolveCrew(state: MissionState, plan: DailyPlan, particleRisk: boolean) {
  const readiness = { ...state.readiness };
  const errors: Partial<Record<CrewId, string>> = {};
  const used = new Set<CrewTask>();
  const safetyLead = crew.find(({ id }) => plan.assignments[id] === 'safety'
    && !assignmentRestrictions(state, plan, 'safety', particleRisk)
    && state.readiness[id] >= (id === 'leena' ? 1 : 2));
  const teamDiscount = (id: CrewId) => Number(safetyLead?.id === 'leena' && id !== 'leena');
  let controller = state.controller;
  let tunedRecycler = false;
  let recoveryBonus = 0;
  let extraGrowth = 0;
  let forecastDays = 0;

  for (const member of crew) {
    const { id, name } = member;
    const task = plan.assignments[id];
    const cost = Math.max(0, crewCost(member, task) - teamDiscount(id));
    if (task === 'rest') {
      readiness[id] = Math.min(maxReadiness, readiness[id] + 2);
      continue;
    }
    const restriction = assignmentRestrictions(state, plan, task, particleRisk);
    if (restriction || state.readiness[id] < cost || used.has(task)) {
      errors[id] = restriction || (used.has(task) ? 'Only one person can do this job.' : `${name} needs ${cost} readiness for this assignment.`);
      continue;
    }
    used.add(task);
    readiness[id] -= cost;
    if (task === 'inspect') controller = 'diagnosed';
    if (task === 'repair') controller = id === 'aya' || state.controller === 'partly-repaired' ? 'repaired' : 'partly-repaired';
    if (task === 'recycle') {
      tunedRecycler = id === 'mateo';
      if (!tunedRecycler) recoveryBonus = 1;
    }
    if (task === 'grow') extraGrowth = id === 'imani' ? 2 : 1;
    if (task === 'radio') forecastDays = id === 'noah' ? 2 : 1;
  }

  return { readiness, discount: Object.fromEntries(crew.map(({ id }) => [id, teamDiscount(id)])) as Record<CrewId, number>, errors, controller, tunedRecycler, recoveryBonus, extraGrowth, forecastDays };
}
