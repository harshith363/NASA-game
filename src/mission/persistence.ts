import { resting } from '../data/crew.ts';
import { commitDay, isDailyPlan, lunarTraining, startMission, type DailyPlan, type DayResult, type Scenario } from './dailyMission.ts';

export const saveKey = 'lunar-training-run';
const version = 2;

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
  const history: DayResult[] = [];
  for (const [index, plan] of save.plans.entries()) {
    const last = commitDay(state, plan, index + 1);
    if (!last) return;
    history.push(last);
    state = last.next;
  }
  return { save, state, last: history.at(-1), history };
}

export function parseSave(raw: string) {
  try {
    const value = JSON.parse(raw) as Partial<Omit<MissionSave, 'version'>> & { version?: number };
    if (value?.version === 1 && Array.isArray(value.plans)) {
      value.plans = value.plans.map(plan => ({ ...plan, assignments: { ...resting } }));
      value.version = version;
    }
    const save = value;
    if (save?.version !== version || save.mode !== lunarTraining.id || typeof save.runId !== 'string'
      || !save.runId || (save.scenario !== 'standard' && save.scenario !== 'lowPower')
      || typeof save.reviewed !== 'boolean' || !Array.isArray(save.plans) || save.plans.length > lunarTraining.days
      || (!save.plans.length && !save.reviewed) || !save.plans.every(isDailyPlan)) return;
    return restoreRun(save as MissionSave);
  } catch {
    return undefined;
  }
}
