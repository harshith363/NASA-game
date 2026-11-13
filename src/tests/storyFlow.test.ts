import { describe, expect, it } from 'vitest';
import { freshSave, gameReducer, type SaveData } from '../app/gameReducer';
import { decodeSave } from '../app/persistence';
import { sceneIds, scenes } from '../content/scenes';

function advanceDialogue(save: SaveData) {
  let next = gameReducer(save, { type: 'next' });
  while (next.currentSceneId === save.currentSceneId && next.step === save.step && next !== save) {
    save = next;
    next = gameReducer(save, { type: 'next' });
  }
  return next;
}

describe('story reducer', () => {
  it('visits all eight scenes, preserves the complete 600-second pacing budget and saves the ending', () => {
    let save = freshSave();
    const visited = [save.currentSceneId];
    for (let count = 0; save.step !== 'end' && count < 30; count++) {
      const previous = save.currentSceneId;
      if (save.step === 'choice') save = gameReducer(save, { type: 'choose', index: 1 });
      else if (save.step === 'puzzle') {
        expect(gameReducer(save, { type: 'next' })).toBe(save);
        save = gameReducer(save, { type: 'solved' });
      } else save = advanceDialogue(save);
      if (save.currentSceneId !== previous) visited.push(save.currentSceneId);
      expect(decodeSave(JSON.stringify(save))).toEqual({ save, invalid: false });
    }
    expect(visited).toEqual(sceneIds);
    expect(Object.values(scenes).reduce((total, scene) => total + scene.estimatedSeconds, 0)).toBe(600);
    expect(save.step).toBe('end');
    expect(save.completedPuzzles).toHaveLength(3);
    expect(save.restoredArtifacts).toEqual(['apollo-11-descent-stage', 'opportunity']);
    expect(save.closingReflection).toBe('What it made possible.');
    const replay = gameReducer(save, { type: 'replay' });
    expect(replay.currentSceneId).toBe('E00');
    expect(replay.restoredArtifacts).toEqual(save.restoredArtifacts);
    expect(replay.closingReflection).toBeUndefined();
  });

  it('backs up dialogue and preserves accessibility preferences on restart', () => {
    let save = gameReducer(freshSave(), { type: 'next' });
    save = gameReducer(save, { type: 'settings', value: { reduceMotion: true } });
    save = gameReducer(save, { type: 'next' });
    expect(save.currentDialogueIndex).toBe(1);
    save = gameReducer(save, { type: 'back' });
    expect(save.currentDialogueIndex).toBe(0);
    expect(gameReducer(save, { type: 'restart' }).settings.reduceMotion).toBe(true);
  });

  it('safely handles malformed, unknown-version and invalid step/index saves', () => {
    expect(decodeSave(null)).toEqual({ save: freshSave(), invalid: false });
    for (const raw of ['{', 'null', '{"schemaVersion":2}', JSON.stringify({ ...freshSave(), step: 'puzzle' }), JSON.stringify({ ...freshSave(), currentDialogueIndex: 99 })]) {
      expect(decodeSave(raw)).toEqual({ save: freshSave(), invalid: true });
    }
  });
});
