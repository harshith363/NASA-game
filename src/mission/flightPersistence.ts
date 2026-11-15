import { commitFlight, startFlight, type FlightState, type FlightEntry } from './flightMission.ts';
import { createSave, parseSave, saveKey } from './persistence.ts';
export const flightSaveKey = 'lunar-training-flight';
export const receiptKey = 'lunar-training-campaign';
export const campaignReceiptKey = (runId: string) => `${receiptKey}/${runId}`;
export interface FlightSave { version: 1; rulesVersion: 1; runId: string; lunarBaseline: string | null; actions: FlightEntry[] }
export function flightSave(s: FlightState): FlightSave { return { version: 1, rulesVersion: 1, runId: s.runId, lunarBaseline: s.lunarBaseline, actions: s.actionJournal }; }
export function parseFlight(raw: string): FlightState | undefined {
  try {
    if (raw.length > 40000) return;
    const v = JSON.parse(raw);
    if (v?.version !== 1 || v.rulesVersion !== 1 || typeof v.runId !== 'string' || !v.runId || v.runId.length > 100 || !Array.isArray(v.actions) || v.actions.length > 120) return;
    if (v.lunarBaseline !== undefined && v.lunarBaseline !== null && (typeof v.lunarBaseline !== 'string' || v.lunarBaseline.length > 20000)) return;
    let state = startFlight(v.runId, v.lunarBaseline ?? null);
    for (const a of v.actions) {
      if (!a || typeof a.id !== 'string' || a.id.length > 150 || typeof a.action !== 'string') return;
      const next = commitFlight(state, a);
      if (!next) return;
      state = next;
    }
    return state;
  } catch { return; }
}
export function retryCheckpoint(s: FlightState): FlightState | undefined {
  let state = startFlight(s.runId, s.lunarBaseline);
  let checkpoint: FlightState | undefined;
  for (const entry of s.actionJournal) {
    state = commitFlight(state, entry)!;
    if ((state.phase === 'engineIncident' || state.phase === 'oxygenIncident') && !state.pendingReport && (entry.action === 'transfer' || entry.action === 'coast')) checkpoint = state;
  }
  return checkpoint;
}
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
// A prepared receipt includes the previous raw journal, so recovery can never
// mistake a different/newer lunar run for the one this flight is replacing.
export function handoffFlight(storage: StoragePort, flightRunId: string, expectedLunar: string | null): string {
  const key = campaignReceiptKey(flightRunId);
  const rawReceipt = storage.getItem(key) ?? storage.getItem(receiptKey);
  let receipt: { version: number; flightRunId: string; lunarRunId: string; status: string; previous: string | null } | undefined;
  try { receipt = rawReceipt ? JSON.parse(rawReceipt) : undefined; } catch { /* Replace invalid receipt only after checking the lunar save. */ }
  if (receipt?.version !== 1 || receipt.flightRunId !== flightRunId || typeof receipt.lunarRunId !== 'string' || !['prepared', 'complete'].includes(receipt.status)) receipt = undefined;
  let current = storage.getItem(saveKey);
  if (receipt && parseSave(current ?? '')?.save.runId === receipt.lunarRunId) {
    storage.setItem(key, JSON.stringify({ ...receipt, status: 'complete' }));
    return receipt.lunarRunId;
  }
  if (receipt?.status === 'complete' || (receipt ? current !== receipt.previous : current !== expectedLunar)) throw new Error('The outpost save changed. Reload and resume that mission; it has not been replaced.');
  if (!receipt) {
    receipt = { version: 1, flightRunId, lunarRunId: crypto.randomUUID(), status: 'prepared', previous: current };
    storage.setItem(key, JSON.stringify(receipt));
  }
  const save = { ...createSave('standard'), runId: receipt.lunarRunId };
  current = storage.getItem(saveKey);
  if (current !== receipt.previous) throw new Error('The outpost save changed. Reload to continue.');
  storage.setItem(saveKey, JSON.stringify(save));
  storage.setItem(key, JSON.stringify({ ...receipt, status: 'complete' }));
  return save.runId;
}
