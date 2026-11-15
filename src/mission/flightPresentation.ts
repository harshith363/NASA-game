import type { FlightAction, FlightPhase } from '../data/flightScenario';
export type FlightCue = 'power' | 'boot' | 'fan' | 'clearance' | 'ignition' | 'staging' | 'burn' | 'warning' | 'confirmation' | 'touchdown';
export interface FlightPresentation { phase: FlightPhase; reduced: boolean; paused: boolean; elapsed: number; returnStage?: number }
export const flightBeats: Partial<Record<FlightPhase, { seconds: number; next: FlightAction }>> = {
  ascent: { seconds: 18, next: 'orbit' },
  departure: { seconds: 8, next: 'transfer' },
  touchdown: { seconds: 9, next: 'touchdown' },
};
