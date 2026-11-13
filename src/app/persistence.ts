import { prologueChoices, reflections, sceneIds, scenes } from '../content/scenes';
import { freshSave, type SaveData } from './gameReducer';

export const saveKey = 'echoes:legacy-archive:v1';
export function decodeSave(raw: string | null): { save: SaveData; invalid: boolean } {
  if (raw === null) return { save: freshSave(), invalid: false };
  try {
    const value = JSON.parse(raw) as SaveData;
    if (value.schemaVersion !== 1 || !sceneIds.includes(value.currentSceneId)) throw new Error();
    const scene = scenes[value.currentSceneId];
    const branching = value.currentSceneId === 'E01' || value.currentSceneId === 'B01';
    const completed = new Set(Object.values(scenes).map(({ puzzleId }) => puzzleId).filter(Boolean));
    const indexLimit = value.step === 'dialogue' ? scene.dialogue.length : value.step === 'closing' ? (scene.closing?.length ?? 1) : 1;
    if (
      !['dialogue', 'choice', 'puzzle', 'closing', 'end'].includes(value.step) ||
      !Number.isInteger(value.currentDialogueIndex) || value.currentDialogueIndex < 0 || value.currentDialogueIndex >= indexLimit ||
      (value.step === 'choice' && !branching) ||
      (value.step === 'puzzle' && !scene.puzzleId) ||
      (value.step === 'closing' && !branching && !scene.puzzleId) ||
      (value.step === 'closing' && value.currentSceneId === 'E01' && !prologueChoices[value.prologueChoice ?? -1]) ||
      (value.currentSceneId === 'B01' && ['closing', 'end'].includes(value.step) && !reflections.includes(value.closingReflection ?? '')) ||
      (value.step === 'end' && value.currentSceneId !== 'B01') ||
      !Array.isArray(value.completedPuzzles) || !value.completedPuzzles.every(id => completed.has(id)) ||
      !Array.isArray(value.restoredArtifacts) || !value.restoredArtifacts.every(id => ['apollo-11-descent-stage', 'opportunity'].includes(id)) ||
      typeof value.settings?.audioEnabled !== 'boolean' ||
      typeof value.settings?.reduceMotion !== 'boolean' ||
      typeof value.settings?.captionsEnabled !== 'boolean'
    ) throw new Error();
    return { save: value, invalid: false };
  } catch {
    return { save: freshSave(), invalid: true };
  }
}
export function readSave() {
  try { return decodeSave(localStorage.getItem(saveKey)); }
  catch { return decodeSave(null); }
}
export function writeSave(save: SaveData) {
  try { localStorage.setItem(saveKey, JSON.stringify(save)); }
  catch { /* Play continues when storage is unavailable. */ }
}
