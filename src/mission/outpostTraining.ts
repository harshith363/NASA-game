import { shelteredCount, ticksPerDay } from './lunarCampaign.ts';
import { constructionTypes, type OutpostState } from './outpostSimulation.ts';

export const trainingEndTick = 3 * ticksPerDay;
export type TrainingSave = { forecastChecked: boolean; complete: boolean };

export function trainingTask(state: OutpostState) {
  const hasFacility = (type: 'solar' | 'greenhouse') => state.facilities.some(facility => facility.type === type);
  const built = (type: 'solar' | 'greenhouse') =>
    state.facilities.some(facility => facility.type === type && facility.progress >= constructionTypes[type].seconds);
  if (state.training?.complete) return 'complete';
  if (!hasFacility('solar')) return 'queue-solar';
  if (!hasFacility('greenhouse')) return 'queue-greenhouse';
  if (state.sheltered && (!built('solar') || !built('greenhouse') || !state.campaign.upgraded)) return 'resume-work';
  if (state.elapsed < ticksPerDay) return 'reach-day-two';
  if (!state.campaign.upgraded) return Object.values(state.campaign.workers).some(worker => worker.assignment?.job === 'power')
    ? 'finish-power-job' : 'assign-power';
  if (state.elapsed < 2 * ticksPerDay) return 'reach-day-three';
  if (!state.training?.forecastChecked) return 'check-forecast';
  if (!built('solar') || !built('greenhouse')) return 'finish-construction';
  if (state.campaign.rover.driver) return 'dock-rover';
  if (!state.sheltered) return 'recall-crew';
  if (state.elapsed < trainingEndTick || shelteredCount(state.campaign, true) < 5) return 'shelter-drill';
  return 'complete';
}

export type TrainingTask = ReturnType<typeof trainingTask>;
