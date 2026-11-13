import { prologueChoices, reflections, sceneIds, scenes, type SceneId } from '../content/scenes';

export type Step = 'dialogue' | 'choice' | 'puzzle' | 'closing' | 'end';
export type SaveData = {
  schemaVersion: 1;
  currentSceneId: SceneId;
  currentDialogueIndex: number;
  step: Step;
  completedPuzzles: string[];
  restoredArtifacts: string[];
  prologueChoice?: number;
  closingReflection?: string;
  settings: { audioEnabled: boolean; reduceMotion: boolean; captionsEnabled: boolean };
};
export type Action =
  | { type: 'next' | 'back' | 'restart' | 'replay' | 'solved' }
  | { type: 'choose'; index: number }
  | { type: 'settings'; value: Partial<SaveData['settings']> };

const artifacts: Partial<Record<SceneId, string>> = { L02: 'apollo-11-descent-stage', M03: 'opportunity' };
const choiceScenes: SceneId[] = ['E01', 'B01'];
export const freshSave = (): SaveData => ({
  schemaVersion: 1, currentSceneId: 'E00', currentDialogueIndex: 0, step: 'dialogue',
  completedPuzzles: [], restoredArtifacts: [],
  settings: { audioEnabled: false, reduceMotion: false, captionsEnabled: true },
});
function enter(state: SaveData, currentSceneId: SceneId): SaveData {
  return {
    ...state, currentSceneId, currentDialogueIndex: 0,
    step: scenes[currentSceneId].dialogue.length ? 'dialogue' : 'puzzle',
    ...(currentSceneId === 'B01' ? { closingReflection: undefined } : {}),
    ...(currentSceneId === 'E01' ? { prologueChoice: undefined } : {}),
  };
}
function withStep(state: SaveData, step: Step): SaveData {
  return { ...state, step, currentDialogueIndex: 0 };
}

export function gameReducer(state: SaveData, action: Action): SaveData {
  const id = state.currentSceneId;
  const scene = scenes[id];
  const position = sceneIds.indexOf(id);
  const nextScene = sceneIds[position + 1];
  switch (action.type) {
    case 'settings': return { ...state, settings: { ...state.settings, ...action.value } };
    case 'replay': return enter({ ...state, prologueChoice: undefined, closingReflection: undefined }, 'E00');
    case 'restart': return enter(state, id);
    case 'choose': {
      if (state.step !== 'choice') return state;
      if (id === 'E01' && prologueChoices[action.index]) {
        return { ...withStep(state, 'closing'), prologueChoice: action.index };
      }
      if (id === 'B01' && reflections[action.index]) {
        return { ...withStep(state, 'closing'), closingReflection: reflections[action.index] };
      }
      return state;
    }
    case 'solved': {
      if (state.step !== 'puzzle' || !scene.puzzleId) return state;
      const artifact = artifacts[id];
      return {
        ...withStep(state, 'closing'),
        completedPuzzles: [...new Set([...state.completedPuzzles, scene.puzzleId])],
        restoredArtifacts: artifact ? [...new Set([...state.restoredArtifacts, artifact])] : state.restoredArtifacts,
      };
    }
    case 'next': {
      if (state.step === 'puzzle' || state.step === 'choice' || state.step === 'end') return state;
      const length = state.step === 'dialogue' ? scene.dialogue.length : (scene.closing?.length ?? 1);
      if (state.currentDialogueIndex + 1 < length) return { ...state, currentDialogueIndex: state.currentDialogueIndex + 1 };
      if (state.step === 'dialogue') {
        if (choiceScenes.includes(id)) return withStep(state, 'choice');
        if (scene.puzzleId) return withStep(state, 'puzzle');
      }
      return nextScene ? enter(state, nextScene) : withStep(state, 'end');
    }
    case 'back': {
      if (state.currentDialogueIndex > 0) return { ...state, currentDialogueIndex: state.currentDialogueIndex - 1 };
      if (state.step === 'end') return withStep(state, 'closing');
      if (state.step === 'closing') return withStep(state, scene.puzzleId ? 'puzzle' : 'choice');
      if (state.step !== 'dialogue' && scene.dialogue.length) {
        return { ...withStep(state, 'dialogue'), currentDialogueIndex: scene.dialogue.length - 1 };
      }
      const previous = sceneIds[position - 1];
      return previous ? enter(state, previous) : state;
    }
  }
}
