import { isLandedOutpostKey, landedOutpostKey, lastLandedOutpostKey, outpostSaveKey, parseOutpost } from '../mission/outpostSimulation';
import { mountFlightScene } from '../scenes/FlightScene';
import { completeLanding, startFlight, type FlightState } from '../mission/flightMission';
import { flightSave, flightSaveKey, parseFlight } from '../mission/flightPersistence';
import { mountFlightControls } from './flightControls';
import type { mountMissionAudio } from '../audio/missionAudio';
import type { MotionPreference } from './motionPreference';

export function mountFlightIntro(audio: ReturnType<typeof mountMissionAudio>, motion: MotionPreference, enter: (saveKey: string | null, arrival: boolean) => Promise<void>) {
  const host = document.querySelector<HTMLElement>('#flight-intro')!;
  const line = document.querySelector<HTMLElement>('#intro-line')!;
  const actions = document.querySelector<HTMLElement>('#intro-actions')!;
  let stored: string | null = null;
  let storageAvailable = true;
  try { stored = localStorage.getItem(flightSaveKey); } catch { storageAvailable = false; }
  const restored = stored ? parseFlight(stored) : undefined;
  let entered = false;
  const backdrop = document.createElement('div');
  backdrop.className = 'flight-menu-scene';
  host.prepend(backdrop);
  const menuScene = mountFlightScene(backdrop);
  menuScene.update({ phase: 'briefing', reduced: motion.reduced, paused: false, elapsed: 0 });
  document.querySelector('#intro-title')!.textContent = 'Earth to Moon';
  line.textContent = 'Power up, launch and solve two spacecraft challenges. After touchdown, enter your lunar outpost to begin the surface mission. Outpost progress resumes paused.';
  if (stored && !restored) line.textContent += ' The flight save could not be read. Start fresh or resume a saved outpost.';
  if (!storageAvailable) line.textContent += ' Unsaved play: browser storage is unavailable.';

  function add(label: string, action: () => void, primary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = primary ? 'action' : 'radio-action';
    button.textContent = label;
    button.onclick = action;
    if (primary) actions.prepend(button);
    else actions.append(button);
  }

  function savedOutpost(key: string) {
    try { return parseOutpost(localStorage.getItem(key) ?? ''); } catch { return undefined; }
  }

  async function openOutpost(key: string | null, arrival: boolean) {
    if (entered) return;
    entered = true;
    try {
      await enter(key, arrival);
      host.hidden = true;
    } catch (error) {
      entered = false;
      throw error;
    }
  }

  async function finish(state: FlightState, unsaved: boolean) {
    const key = unsaved || !storageAvailable ? null : landedOutpostKey(state.runId);
    await openOutpost(key, !key || !savedOutpost(key));
  }

  function openFromMenu(action: () => Promise<void>) {
    if (entered) return;
    menuScene.dispose();
    audio.resume();
    void action().catch(error => {
      line.textContent = error instanceof Error ? error.message : 'Could not open the lunar outpost.';
    });
  }

  function begin(sound: boolean | undefined, resume = false) {
    menuScene.dispose();
    if (sound === undefined) audio.resume(); else audio.start(sound);
    const state = resume && restored ? restored : startFlight(crypto.randomUUID());
    if (!resume) {
      try {
        const raw = JSON.stringify(flightSave(state));
        localStorage.setItem(flightSaveKey, raw);
        stored = raw;
      } catch { storageAvailable = false; }
    }
    mountFlightControls(host, state, motion, audio, finish, stored);
  }


  actions.replaceChildren();
  add('Start mission', () => begin(false), true);
  if (restored && !completeLanding(restored)) add('Resume flight', () => begin(undefined, true));

  let lastKey: string | null = null;
  try {
    const previousKey = localStorage.getItem(lastLandedOutpostKey);
    if (isLandedOutpostKey(previousKey)) lastKey = previousKey;
  } catch { /* Storage may be unavailable. */ }
  const completed = restored && completeLanding(restored);
  const landingKey = completed ? landedOutpostKey(completed.runId) : null;
  const savedKeys: string[] = [];
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (isLandedOutpostKey(key)) savedKeys.push(key);
    }
  } catch { /* Continue with known saves. */ }
  const candidates = [...new Set([landingKey, lastKey, outpostSaveKey, ...savedKeys.reverse()].filter((key): key is string => !!key))];
  const activeKey = candidates.find(key => {
    const save = savedOutpost(key);
    return save?.outcome === 'active';
  });
  const reportKey = candidates.find(key => savedOutpost(key)?.outcome === 'ready');

  if (completed && landingKey && !savedOutpost(landingKey)) {
    add('Enter lunar outpost', () => openFromMenu(async () => {
      if (completed !== restored && storageAvailable) {
        if (localStorage.getItem(flightSaveKey) !== stored) throw new Error('Flight changed in another tab. Reload to continue.');
        localStorage.setItem(flightSaveKey, JSON.stringify(flightSave(completed)));
      }
      await finish(completed, false);
    }));
  } else if (activeKey) {
    const active = savedOutpost(activeKey)!;
    add(active.campaign.flight ? 'Resume return flight' : 'Resume outpost', () => openFromMenu(() => openOutpost(activeKey, false)));
  }
  if (reportKey) add('View previous game report', () => openFromMenu(() => openOutpost(reportKey, false)));
  add('Go directly to outpost', () => openFromMenu(() => openOutpost(storageAvailable ? outpostSaveKey : null, !savedOutpost(outpostSaveKey))));
  try {
    if (sessionStorage.getItem('lunar-start-new-mission') === 'true') {
      sessionStorage.removeItem('lunar-start-new-mission');
      begin(false);
    }
  } catch { /* The chapter menu remains available. */ }
}
