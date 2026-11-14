import type { MotionPreference } from './motionPreference';
import type { PresentMissionEvent } from '../mission/presentation';

export function mountFlightIntro(
  ready: Promise<void>,
  present: PresentMissionEvent,
  startAudio: (enabled: boolean) => void,
  resumeAudio: () => void,
  onEnter: (resume: boolean) => void,
  canResume: boolean,
  recoveryNotice: string,
  motion: MotionPreference,
) {
  const game = document.querySelector<HTMLElement>('#mission-workspace')!;
  const intro = document.querySelector<HTMLElement>('#flight-intro')!;
  const line = document.querySelector<HTMLElement>('#intro-line')!;
  const actions = document.querySelector<HTMLElement>('#intro-actions')!;
  const skip = document.querySelector<HTMLButtonElement>('#intro-skip')!;
  let stage: 'launch' | 'arrival' | 'done' = 'launch';
  let endTimer = 0;

  function enter(resume = false) {
    if (stage === 'done') return;
    stage = 'done';
    clearTimeout(endTimer);
    intro.hidden = true;
    game.inert = false;
    onEnter(resume);
  }

  async function start(sound: boolean | undefined) {
    if (stage !== 'launch') return;
    stage = 'arrival';
    if (sound === undefined) resumeAudio();
    else startAudio(sound);
    intro.dataset.stage = stage;
    actions.hidden = true;
    skip.hidden = false;
    skip.focus();
    line.textContent = 'Pilot: Welcome to the outpost. Check the solar power and food before you plan the first day.';
    await ready;
    if (stage !== 'arrival') return;
    if (motion.reduced) return enter();
    present({ type: 'arrival' });
    endTimer = window.setTimeout(enter, 6200);
  }

  if (recoveryNotice) line.textContent = recoveryNotice;
  if (canResume) {
    const resume = document.querySelector<HTMLButtonElement>('#resume-mission')!;
    const restart = document.querySelector<HTMLButtonElement>('#new-mission')!;
    line.textContent = 'A saved Lunar mission is ready. Starting a new mission replaces it.';
    document.querySelector<HTMLButtonElement>('#start-sound')!.hidden = true;
    document.querySelector<HTMLButtonElement>('#start-muted')!.hidden = true;
    resume.hidden = false;
    restart.hidden = false;
    resume.addEventListener('click', () => {
      if (stage !== 'launch') return;
      resumeAudio();
      enter(true);
    });
    restart.addEventListener('click', () => void start(undefined));
  }
  document.querySelector('#start-sound')!.addEventListener('click', () => void start(true));
  document.querySelector('#start-muted')!.addEventListener('click', () => void start(false));
  skip.addEventListener('click', () => { if (stage === 'arrival') enter(); });
  motion.changes.addEventListener('change', () => { if (stage === 'arrival' && motion.reduced) enter(); });
}
