import { crew, crewCost, crewTasks, maxReadiness, type Assignments, type CrewId, type CrewTask } from '../data/crew';
import { assignmentRestrictions } from '../mission/crewOperations';
import { forecastPower, hasParticleRisk, lunarTraining, type DailyPlan, type DayResult, type MissionState } from '../mission/dailyMission';

const taskIds = Object.keys(crewTasks) as CrewTask[];

export function mountCrewControls(onConsult: () => void) {
  const panel = document.querySelector<HTMLElement>('#crew-panel')!;
  const deck = document.querySelector<HTMLElement>('#crew-cards')!;
  const advice = document.querySelector<HTMLElement>('#crew-advice')!;
  let consulted: CrewId | undefined;
  let briefing: { state: MissionState; result: DayResult } | undefined;
  const cards = crew.map(member => {
    const card = document.createElement('article');
    card.className = 'crew-card';
    card.style.setProperty('--crew-accent', `#${member.color.toString(16)}`);
    card.innerHTML = `
      <div class="crew-identity">
        <img src="/media/crew-${member.id}.webp" alt="" width="54" height="54" />
        <div><h4>${member.name}</h4><p>${member.role}</p></div>
        <button class="radio-action" type="button" aria-label="Consult ${member.name}">Consult</button>
      </div>
      <p class="crew-skill">${member.detail}</p>
      <p class="crew-readiness"></p><div class="readiness-track" aria-hidden="true">${'<span></span>'.repeat(maxReadiness)}</div>
      <label for="task-${member.id}">Assignment<span class="visually-hidden"> for ${member.name}</span></label>
      <select id="task-${member.id}" aria-describedby="task-note-${member.id}"></select>
      <p class="task-note" id="task-note-${member.id}"></p>`;
    const select = card.querySelector('select')!;
    for (const task of taskIds) select.add(new Option(crewTasks[task].name, task));
    const button = card.querySelector('button')!;
    button.addEventListener('click', () => {
      consulted = member.id;
      for (const item of cards) item.button.setAttribute('aria-pressed', String(item.member.id === consulted));
      updateAdvice();
      advice.scrollIntoView({ block: 'nearest' });
      onConsult();
    });
    deck.append(card);
    return {
      member, select, button,
      readiness: card.querySelector<HTMLElement>('.crew-readiness')!,
      segments: [...card.querySelectorAll('.readiness-track span')],
      note: card.querySelector<HTMLElement>('.task-note')!,
    };
  });

  function updateAdvice() {
    advice.hidden = !consulted || !briefing;
    if (!consulted || !briefing) return;
    const { state, result } = briefing;
    const dialogue = {
      aya: [state.controller === 'repaired' ? 'The controller is working. That adds one solar power each day.'
        : state.controller === 'uninspected' ? 'Give me a clear day to inspect the solar controller. We may be able to recover more power.'
          : 'We found the controller fault. Give me one clear shift for a repair.',
        `Today we expect ${result.generation} solar power. This plan leaves ${result.next.battery} in the battery.`],
      mateo: [`We have ${state.air} reserve air and ${state.water} drinking water. Keep normal air running during the peak if the battery can cover it.`,
        `With this plan the recycler returns ${result.recovered} water. I can tune it inside the shelter from day two.`],
      imani: [`Our crop has ${state.crop} of ${lunarTraining.cropTarget} progress. This plan adds ${result.growth}.`,
        'If we dim the lights during the alert, we can pick up the growth again after it passes. Keep an eye on the meals left.'],
      leena: [hasParticleRisk(result.phase) ? 'Shelter the entire crew. Outside assignments need to wait.'
        : 'I’d use this window for work outside. I can run shelter checks if you move the crew in early.',
        `The lowest crew readiness is ${Math.min(...Object.values(state.readiness))} of ${maxReadiness}. A day of rest restores two.`],
      noah: [`The panels can supply ${forecastPower(result.day, state.controller)} power today. I can compare lighting plans for up to two upcoming days.`,
        result.day > lunarTraining.stormStart + 1 ? 'Mission Control confirms that the particle alert has passed.'
          : `Mission Control expects the particle rise on day ${lunarTraining.stormStart} and the peak on day ${lunarTraining.stormStart + 1}.`],
    }[consulted];
    const member = crew.find(({ id }) => id === consulted)!;
    const lines = [member.name, ...dialogue].map((text, index) => {
      const item = document.createElement(index ? 'p' : 'strong');
      item.textContent = text;
      return item;
    });
    advice.replaceChildren(...lines);
  }

  return {
    panel,
    set(assignments: Assignments) {
      consulted = undefined;
      advice.hidden = true;
      for (const { member, select } of cards) select.value = assignments[member.id];
    },
    read(): Assignments {
      return Object.fromEntries(cards.map(({ member, select }) => [member.id, select.value])) as Assignments;
    },
    render(state: MissionState, plan: DailyPlan, result: DayResult) {
      briefing = { state, result };
      for (const { member, select, readiness, segments, note, button } of cards) {
        const { id } = member;
        const selected = plan.assignments[id];
        const error = result.operations.errors[id];
        button.setAttribute('aria-pressed', String(consulted === id));
        const status = state.readiness[id] >= 3 ? 'Ready' : state.readiness[id] > 0 ? 'Tired' : 'Needs rest';
        segments.forEach((segment, index) => segment.toggleAttribute('data-filled', index < state.readiness[id]));
        readiness.textContent = `${status} · readiness ${state.readiness[id]} → ${result.operations.readiness[id]} of ${maxReadiness}`;
        for (const option of select.options) {
          const task = option.value as CrewTask;
          const cost = Math.max(0, crewCost(member, task) - result.operations.discount[id]);
          const restriction = assignmentRestrictions(state, plan, task, hasParticleRisk(result.phase));
          const reason = restriction || (cost > state.readiness[id] ? 'needs more readiness' : '');
          option.disabled = Boolean(reason && task !== selected);
          const effect = task === 'repair' ? id === 'aya' || state.controller === 'partly-repaired' ? 'finish repair' : 'first repair shift'
            : task === 'grow' ? `+${id === 'imani' ? 2 : 1} growth with water`
              : task === 'recycle' ? id === 'mateo' ? 'save 1 power' : '+1 possible water'
                : task === 'radio' ? `${Math.min(id === 'noah' ? 2 : 1, lunarTraining.days - result.day)}-day forecast` : '';
          option.textContent = [crewTasks[task].name, task === 'rest' ? '+2 readiness' : `−${cost} readiness`, reason || effect].filter(Boolean).join(' · ');
        }
        select.setAttribute('aria-invalid', String(Boolean(error)));
        note.textContent = error ?? '';
      }
      updateAdvice();
    },
  };
}
