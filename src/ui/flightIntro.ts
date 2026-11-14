import type { PresentMissionEvent } from '../mission/solarStorm';

export function mountFlightIntro(
  ready: Promise<void>,
  present: PresentMissionEvent,
  startAudio: (enabled: boolean) => void,
  onEnter: () => void,
) {
  const game = document.querySelector<HTMLElement>('#mission-workspace')!;
  const intro = document.querySelector<HTMLElement>('#flight-intro')!;
  const line = document.querySelector<HTMLElement>('#intro-line')!;
  const actions = document.querySelector<HTMLElement>('#intro-actions')!;
  const skip = document.querySelector<HTMLButtonElement>('#intro-skip')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let stage: 'launch' | 'arrival' | 'done' = 'launch';
  let alertTimer = 0;
  let endTimer = 0;

  function enter() {
    if (stage === 'done') return;
    stage = 'done';
    clearTimeout(alertTimer);
    clearTimeout(endTimer);
    present({ type: 'warning' });
    intro.hidden = true;
    game.inert = false;
    onEnter();
  }

  async function start(sound: boolean) {
    if (stage !== 'launch') return;
    stage = 'arrival';
    startAudio(sound);
    intro.dataset.stage = stage;
    actions.hidden = true;
    skip.hidden = false;
    skip.focus();
    line.textContent = 'Pilot: Welcome to the outpost. The greenhouse is almost ready for its next harvest.';
    await ready;
    if (stage !== 'arrival') return;
    if (motion.matches) return enter();
    present({ type: 'arrival' });
    alertTimer = window.setTimeout(() => {
      line.textContent = 'Tower: Particle readings are rising. Check the shelter systems.';
      present({ type: 'warning' });
    }, 6600);
    endTimer = window.setTimeout(enter, 9600);
  }

  document.querySelector('#start-sound')!.addEventListener('click', () => void start(true));
  document.querySelector('#start-muted')!.addEventListener('click', () => void start(false));
  skip.addEventListener('click', () => { if (stage === 'arrival') enter(); });
  motion.addEventListener('change', () => { if (stage === 'arrival' && motion.matches) enter(); });
}
