import { commitDay, isDailyPlan, lunarTraining, startMission, type DailyPlan, type DayResult, type Scenario } from './dailyMission.ts';

export const saveKey = 'lunar-training-run';
const version = 1;

export interface MissionSave {
  version: typeof version;
  mode: typeof lunarTraining.id;
  runId: string;
  scenario: Scenario;
  plans: DailyPlan[];
  reviewed: boolean;
}

export function createSave(scenario: Scenario): MissionSave {
  return { version, mode: lunarTraining.id, runId: crypto.randomUUID(), scenario, plans: [], reviewed: true };
}

// The journal is the canonical save. Replaying a maximum of seven validated
// turns restores the resources, fixed event schedule, and last report together.
function restoreRun(save: MissionSave) {
  let state = startMission(save.scenario);
  let last: DayResult | undefined;
  for (const [index, plan] of save.plans.entries()) {
    last = commitDay(state, plan, index + 1);
    if (!last) return;
    state = last.next;
  }
  return { save, state, last };
}

export function parseSave(raw: string) {
  try {
    const save = JSON.parse(raw) as Partial<MissionSave>;
    if (save?.version !== version || save.mode !== lunarTraining.id || typeof save.runId !== 'string'
      || !save.runId || (save.scenario !== 'standard' && save.scenario !== 'lowPower')
      || typeof save.reviewed !== 'boolean' || !Array.isArray(save.plans) || save.plans.length > lunarTraining.days
      || (!save.plans.length && !save.reviewed) || !save.plans.every(isDailyPlan)) return;
    return restoreRun(save as MissionSave);
  } catch {
    return undefined;
  }
}
