import type { DayResult, MissionState, StormPhase } from './dailyMission';

export type MissionEvent =
  | { type: 'arrival' | 'warning' | 'forecast' }
  | { type: 'day'; previous: MissionState; result: DayResult; duration: number }
  | { type: 'settled' | 'reset' | 'debrief'; state: MissionState; phase: StormPhase };

export type PresentMissionEvent = (event: MissionEvent) => void;
