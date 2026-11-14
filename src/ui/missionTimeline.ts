import { crew, crewTasks, resting } from '../data/crew';
import { forecastPower, hasParticleRisk, lunarTraining, previewDay, stormPhase, type DailyPlan, type DayResult, type MissionState } from '../mission/dailyMission';

const rules = lunarTraining;
const milestones = ['Arrival', 'Warning', 'Shelter', 'Peak', 'Recovery', 'Supplies', 'Finish'];

export function harvestForecast(plan: DailyPlan, today: DayResult) {
  if (today.hazards.length || today.powerGap || Object.keys(today.operations.errors).length) return;
  let result = today;
  while (!result.harvest && result.next.outcome === 'active') {
    const phase = stormPhase(result.day + 1);
    result = previewDay(result.next, {
      ...plan, location: hasParticleRisk(phase) ? 'shelter' : 'habitat',
      airMode: 'normal', assignments: resting,
    });
    if (result.hazards.length || result.powerGap) return;
  }
  if (result.harvest) return result.day;
}

export function forecastAdvice(state: MissionState, plan: DailyPlan, count: number) {
  const lines: string[] = [];
  let next = state;
  for (let offset = 0; offset < count && next.outcome === 'active'; offset++) {
    const day = next.completedDays + 1;
    const location = hasParticleRisk(stormPhase(day)) ? 'shelter' : 'habitat';
    const base = { ...plan, location, airMode: 'normal', assignments: resting } as const;
    const low = previewDay(next, { ...base, lights: 'low' });
    const full = previewDay(next, { ...base, lights: 'full' });
    const summarize = (result: DayResult) => result.hazards.length || result.powerGap
      ? 'shortage predicted'
      : result.harvest ? `${result.next.battery} battery, harvest ready`
        : `${result.next.battery} battery, +${result.growth} crop`;
    lines.push(`Day ${day} planning check with normal air and resting crew${offset ? ', after Low lights on prior days' : ''}. Low lights: ${summarize(low)}. Full lights: ${summarize(full)}.`);
    if (low.hazards.length || low.powerGap) break;
    next = low.next;
  }
  return lines;
}

export function mountTimeline(openToday: () => void, openReport: (result: DayResult) => string[]) {
  const timeline = document.querySelector<HTMLElement>('#mission-timeline')!;
  const dialog = document.querySelector<HTMLDialogElement>('#timeline-detail')!;
  const heading = dialog.querySelector('h2')!;
  const body = dialog.querySelector<HTMLElement>('#timeline-body')!;
  let current: { state: MissionState; history: DayResult[]; draft?: DayResult; harvest?: number };
  const buttons = milestones.map((milestone, index) => {
    const day = index + 1;
    const button = document.createElement('button');
    button.type = 'button';
    const title = document.createElement('strong');
    title.textContent = `Day ${day}`;
    const detail = document.createElement('small');
    button.append(title, detail);
    button.addEventListener('click', () => {
      const { history, draft, state } = current;
      const result = history[index];
      if (!result && draft?.day === day) return openToday();
      heading.textContent = `Day ${day} · ${result ? 'Report' : milestone}`;
      const lines = result ? openReport(result) : state.outcome !== 'active'
        ? ['The mission ended before this day.']
        : [`Mission forecast · ${forecastPower(day, state.controller)} solar power with the current controller. No future repairs assumed.`,
          hasParticleRisk(stormPhase(day)) ? 'Shelter required. Outside work pauses.' : 'Use the daily briefing for the next decision.',
          ...(current.harvest === day ? ['Estimated harvest with current lights and recovery, normal air, resting crew, and shelter during alerts.'] : [])];
      body.replaceChildren(...lines.map(line => {
        const item = document.createElement('p');
        item.textContent = line;
        return item;
      }));
      dialog.showModal();
    });
    timeline.append(button);
    return { button, detail, day, milestone };
  });
  return (state: MissionState, history: DayResult[], draft?: DayResult, harvest?: number) => {
    current = { state, history, draft, harvest };
    for (const { button, detail, day, milestone } of buttons) {
      const result = history[day - 1];
      const today = draft?.day === day;
      const work = today && crew.find(({ id }) => draft.next.lastPlan.assignments[id] !== 'rest');
      const jobs = work && draft ? crewTasks[draft.next.lastPlan.assignments[work.id]].name : '';
      const alert = hasParticleRisk(stormPhase(day)) || day === rules.stormStart - 1;
      detail.textContent = result ? `${alert ? milestone : result.harvest ? 'Harvest' : milestone} ✓`
        : state.outcome !== 'active' ? '—' : alert ? milestone : harvest === day ? 'Harvest est.' : work ? 'Work planned' : milestone;
      const harvestDetail = (result?.harvest || harvest === day) && alert ? ', harvest' : '';
      button.dataset.state = result ? 'done' : today ? 'today' : 'forecast';
      if (today) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.setAttribute('aria-label', `Day ${day}, ${result ? 'committed report' : today ? 'current plan' : 'forecast'}, ${detail.textContent}${harvestDetail}${jobs ? `, ${jobs}` : ''}`);
    }
  };
}
