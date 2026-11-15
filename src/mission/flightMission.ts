import { costs, lessons, type FlightAction, type FlightPhase, type Reserves } from '../data/flightScenario.ts';
export interface FlightEntry { id: string; action: FlightAction }
export interface FlightState {
  runId: string; lunarBaseline: string | null; scenarioId: 'earth-moon'; rulesVersion: 1; phase: FlightPhase;
  resources: Reserves; startupSystems: FlightAction[]; actionJournal: FlightEntry[];
  pendingReport?: string; reports: { action: FlightAction; text: string; resources: Reserves }[];
  outcome: 'active' | 'landed'; handoffStatus: 'pending' | 'ready';
}
export function startFlight(runId: string, lunarBaseline: string | null = null): FlightState {
  return { runId, lunarBaseline, scenarioId: 'earth-moon', rulesVersion: 1, phase: 'briefing', resources: { fuel: 18, battery: 16, oxygen: 16 }, startupSystems: [], actionJournal: [], reports: [], outcome: 'active', handoffStatus: 'pending' };
}
export function legalActions(s: FlightState): FlightAction[] {
  if (s.pendingReport) return ['acknowledge'];
  const has = (a: FlightAction) => s.startupSystems.includes(a);
  switch (s.phase) {
    case 'briefing': return ['start'];
    case 'startup': {
      if (!has('ground')) return ['ground'];
      if (!has('avionics')) return ['avionics'];
      const actions: FlightAction[] = [];
      if (!has('life')) actions.push('life');
      if (!has('align')) actions.push('align');
      else if (!has('route')) actions.push('route');
      else if (!has('confirm')) actions.push('confirm');
      return actions;
    }
    case 'clearance': return !has('onboard') ? ['onboard'] : ['go'];
    case 'countdown': return has('authorize') ? ['ignite'] : ['authorize'];
    case 'ascent': return ['orbit'];
    case 'earthOrbit': return ['depart'];
    case 'departure': return ['transfer'];
    case 'engineIncident': return has('inspect') ? ['cool', 'thrusters'] : ['inspect'];
    case 'coast': return ['coast'];
    case 'oxygenIncident': return has('isolate') ? ['repair', 'bypass'] : ['isolate'];
    case 'lunarOrbit': return ['capture'];
    case 'descent': return has('checklist') ? ['land'] : ['checklist'];
    case 'touchdown': return ['touchdown'];
    case 'debrief': return has('report') ? ['finish'] : ['report'];
    case 'outpost': return [];
  }
}
const nextPhase: Partial<Record<FlightAction, FlightPhase>> = { start: 'startup', go: 'countdown', ignite: 'ascent', orbit: 'earthOrbit', depart: 'departure', transfer: 'engineIncident', cool: 'coast', thrusters: 'coast', coast: 'oxygenIncident', repair: 'lunarOrbit', bypass: 'lunarOrbit', capture: 'descent', land: 'touchdown', touchdown: 'debrief', finish: 'outpost' };
function apply(s: FlightState, action: FlightAction): FlightState {
  const cost = action in costs ? costs[action as keyof typeof costs] : { fuel: 0, battery: 0, oxygen: 0 };
  const resources = { fuel: s.resources.fuel - cost.fuel, battery: s.resources.battery - cost.battery, oxygen: s.resources.oxygen - cost.oxygen };
  const systems = action === 'acknowledge' ? s.startupSystems : [...s.startupSystems, action];
  let phase = nextPhase[action] ?? s.phase;
  if (phase === 'startup' && systems.includes('life') && systems.includes('confirm')) phase = 'clearance';
  const report = lessons[action];
  return { ...s, phase, resources, startupSystems: systems, pendingReport: report,
    reports: report ? [...s.reports, { action, text: report, resources }] : s.reports,
    outcome: phase === 'touchdown' || phase === 'debrief' || phase === 'outpost' ? 'landed' : 'active', handoffStatus: phase === 'outpost' ? 'ready' : 'pending' };
}
function safe(r: Reserves) { return Object.values(r).every(Number.isFinite) && r.fuel >= 0 && r.battery >= 0 && r.oxygen > 0; }
// Explore the small remaining decision tree, rather than combining incompatible
// minimum fuel/power/oxygen budgets from different recovery options.
export function canReachLanding(s: FlightState): boolean {
  if (!safe(s.resources)) return false;
  if (s.outcome === 'landed') return true;
  return legalActions(s).some(action => canReachLanding(apply(s, action)));
}
export function previewFlight(s: FlightState, action: FlightAction) {
  if (!legalActions(s).includes(action)) return { allowed: false as const, reason: 'Complete the current check or acknowledge the result first.' };
  const next = apply(s, action);
  if (!canReachLanding(next)) return { allowed: false as const, reason: 'This leaves too little for remaining maneuvers and breathing supply. Retry the checkpoint.' };
  return { allowed: true as const, next, reason: '' };
}
export function commitFlight(s: FlightState, entry: FlightEntry): FlightState | undefined {
  if (!entry.id || s.actionJournal.some(item => item.id === entry.id) || s.actionJournal.length >= 120) return;
  const result = previewFlight(s, entry.action);
  if (!result.allowed) return;
  return { ...result.next, actionJournal: [...s.actionJournal, entry] };
}
/** Finish the existing journal after touchdown without requiring a separate report click. */
export function completeLanding(state: FlightState): FlightState | undefined {
  if (state.phase === 'outpost') return state;
  if (state.phase !== 'debrief') return;
  const commit = (current: FlightState, action: FlightAction) =>
    commitFlight(current, { id: `${current.runId}/${current.actionJournal.length}/${action}`, action });
  const reported = state.startupSystems.includes('report') ? state : commit(state, 'report');
  return reported && commit(reported, 'finish');
}

export function landingReserve(s: FlightState): Reserves {
  const phase = s.phase;
  if (['touchdown', 'debrief', 'outpost'].includes(phase)) return { fuel: 0, battery: 0, oxygen: 1 };
  if (phase === 'descent') return { fuel: 3, battery: 1, oxygen: 2 };
  return { fuel: 6, battery: 2, oxygen: 3 };
}
