import { crew } from '../data/crew';
import { archivedSolarEvent } from '../data/archivedSolarEvent';
import { lunarTraining, previewDay, type DailyPlan, type DayResult, type MissionState } from '../mission/dailyMission';
import type { MotionPreference } from './motionPreference';

const still = '/media/particle-alert-poster.webp';
const loop = '/media/particle-alert.gif';
const start = lunarTraining.stormStart;
const safety = crew.find(({ id }) => id === 'leena')!;
const power = crew.find(({ id }) => id === 'aya')!;

export function mountStormBriefing(motion: MotionPreference, onRadio: () => void, onPlan: (plan?: DailyPlan) => void) {
  const dialog = document.querySelector<HTMLDialogElement>('#storm-briefing')!;
  const image = dialog.querySelector<HTMLImageElement>('img')!;
  const animation = dialog.querySelector<HTMLButtonElement>('#storm-animation')!;
  const advice = dialog.querySelector<HTMLElement>('#storm-dialogue')!;
  const tradeoffs = dialog.querySelector<HTMLElement>('#storm-options')!;
  const archived = dialog.querySelector<HTMLAnchorElement>('#storm-source')!;
  const replies = [...dialog.querySelectorAll<HTMLButtonElement>('[data-storm-reply]')];
  let failed = false;
  let paused = false;
  let compare: { state: MissionState; plan: DailyPlan; alertDay: number } | undefined;
  let caller: HTMLElement | null = null;

  archived.href = archivedSolarEvent.sourceUrl;

  function updateMedia() {
    if (!dialog.open) return;
    const play = !motion.reduced && !failed && !paused;
    const url = play ? loop : still;
    image.hidden = false;
    if (image.getAttribute('src') !== url) image.src = url;
    animation.hidden = motion.reduced || failed;
    animation.textContent = play ? 'Pause illustration' : 'Play illustration';
  }

  image.addEventListener('error', () => {
    if (!dialog.open) return;
    if (image.getAttribute('src') === loop) {
      failed = true;
      updateMedia();
    } else image.hidden = true;
  });
  animation.addEventListener('click', () => {
    paused = !paused;
    updateMedia();
  });
  motion.changes.addEventListener('change', updateMedia);
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    caller?.focus({ preventScroll: true });
  });
  dialog.querySelector('#storm-close')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('#storm-controls')!.addEventListener('click', () => {
    caller = null;
    dialog.close();
    onPlan();
  });

  function speak(member: typeof safety | typeof power, text: string) {
    const image = document.createElement('img');
    image.src = `/media/crew-${member.id}.webp`;
    image.width = 52;
    image.height = 52;
    image.alt = '';
    const body = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = `${member.name} · ${member.role}`;
    const line = document.createElement('p');
    line.textContent = text;
    body.append(name, line);
    const turn = document.createElement('article');
    turn.className = 'dialogue-turn';
    turn.append(image, body);
    return turn;
  }

  function explain(tradeoff: boolean) {
    if (!compare) return;
    const { state, plan, alertDay } = compare;
    for (const button of replies) button.setAttribute('aria-pressed', String(button.dataset.stormReply === (tradeoff ? 'tradeoff' : 'risk')));
    const reading = alertDay === start + 1 ? 'Particle readings are at their peak today.'
      : alertDay === state.completedDays + 1 ? 'Particle readings are rising today.'
        : `Particle readings will rise on day ${start}.`;
    advice.replaceChildren(
      speak(safety, tradeoff ? 'I’ll put sheltering first. Then we can decide how much power to leave for the crop.'
        : `${reading} Move everyone into the shelter. Outside assignments can wait.`),
      speak(power, tradeoff ? `You have ${state.battery} battery and ${state.air} reserve air. Compare how lower lights change the budget.`
        : 'The walls shield the crew. We need power for ventilation, air systems, and whatever lights we leave on.'),
    );
    if (!tradeoffs.childElementCount) {
      const options = [
        { lights: 'low' as const, airMode: 'normal' as const, label: 'Shelter with Low lights' },
        { lights: 'off' as const, airMode: 'normal' as const, label: 'Shelter and pause the lights' },
      ];
      tradeoffs.replaceChildren(...options.map(option => {
        const assignments = { ...plan.assignments };
        for (const key of Object.keys(assignments) as (keyof typeof assignments)[]) {
          if (['inspect', 'repair', 'grow'].includes(assignments[key])) assignments[key] = 'rest';
        }
        const selection: DailyPlan = { ...plan, lights: option.lights, airMode: option.airMode, location: 'shelter', assignments };
        const reference = { ...state, completedDays: alertDay - 1 };
        const result = previewDay(reference, selection);
        const row = document.createElement('article');
        row.className = 'storm-option';
        const label = document.createElement('strong');
        label.textContent = option.label;
        const effect = document.createElement('p');
        const projection = `${result.next.battery} battery · ${result.next.air} reserve air · +${result.growth} crop progress.`;
        const consequence = result.harvest ? 'A harvest is ready.' : option.lights === 'off'
          ? 'Crop growth pauses for the day.' : 'Watered crops keep growing toward the next harvest.';
        effect.textContent = (alertDay > state.completedDays + 1 ? 'Estimate using today’s reserves. ' : '') + projection + ' ' + consequence;
        row.append(label, effect);
        if (alertDay === state.completedDays + 1) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'radio-action';
          button.textContent = 'Use in today’s plan';
          button.setAttribute('aria-label', `Use ${option.label.toLowerCase()} in today’s plan`);
          button.addEventListener('click', () => { dialog.close(); caller = null; onPlan(selection); });
          row.append(button);
        }
        return row;
      }));
    }
  }

  for (const button of replies) button.addEventListener('click', () => explain(button.dataset.stormReply === 'tradeoff'));

  return {
    open(state: MissionState, plan: DailyPlan, showTradeoffs = false) {
      const day = state.completedDays + 1;
      const alertDay = Math.min(start + 1, Math.max(start, day));
      compare = { state, plan, alertDay };
      tradeoffs.replaceChildren();
      tradeoffs.hidden = false;
      caller = document.activeElement as HTMLElement | null;
      dialog.querySelector('#storm-risk')!.textContent = `Crew safety and the battery. Shelter on days ${start} and ${start + 1}. At the peak, the air system needs one extra power.`;
      dialog.showModal();
      dialog.scrollTop = 0;
      dialog.querySelector<HTMLElement>('h2')!.focus();
      updateMedia();
      explain(showTradeoffs);
      onRadio();
    },
  };
}
