import { constructionTypes, missionDay, outpostStorm, type OutpostState } from '../mission/outpostSimulation';
import { shelteredCount, ticksPerDay } from '../mission/lunarCampaign';
import { trainingEndTick, trainingTask } from '../mission/outpostTraining';
import { mountGuideSpotlight } from './guideSpotlight';

const buildPanel = '#sim-build-panel';
const facilities = '#sim-facility-panel';
const roverPanel = '#campaign-rover';
type Advice = { title: string; instruction: string; target?: string };

export function mountOutpostCoach(host: HTMLElement, dismiss: () => void, reference: () => void) {
  const card = document.createElement('aside');
  card.className = 'console training-coach';
  card.hidden = true;
  card.setAttribute('aria-labelledby', 'training-title');
  card.innerHTML = `
    <header><p data-training-day></p><button type="button" class="icon-button" aria-label="Close tutorial" title="Close tutorial">×</button></header>
    <div role="status"><h2 id="training-title"></h2><p data-training-action></p></div>
    <button type="button" class="radio-action" data-training-reference>Facility tour</button>`;
  host.append(card);
  const spotlight = mountGuideSpotlight(host, card, 310);
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector);
  q<HTMLButtonElement>('.training-coach .icon-button')!.onclick = dismiss;
  q<HTMLButtonElement>('[data-training-reference]')!.onclick = reference;
  card.addEventListener('keydown', event => {
    if (event.key === 'Escape') dismiss();
  });
  let last: Advice | undefined;

  function visible(selector: string) {
    return !!q(selector)?.getClientRects().length;
  }
  function openPanel(marker: string, control: string, opens: string, title: string): Advice {
    // On small screens an open panel may cover the next map marker.
    const close = ['#sim-close-facility', '#sim-build-close', '#campaign-rover header button', '#campaign-departure header button'].find(visible);
    if (close) return { title, instruction: `Close this panel, then select ${control} to open ${opens}.`, target: close };
    return { title, instruction: `Select ${control} to open ${opens}.`, target: marker };
  }
  function play(title: string, effect: string, paused: boolean): Advice {
    return paused
      ? { title, instruction: `Press Play to ${effect} Use the speed button to run at up to 4×.`, target: '#sim-play' }
      : { title, instruction: `Let the clock run to ${effect}`, target: '#sim-time' };
  }
  function advice(state: OutpostState, paused: boolean): Advice {
    const task = trainingTask(state);
    switch (task) {
      case 'queue-solar':
      case 'queue-greenhouse': {
        const type = task === 'queue-solar' ? 'solar' : 'greenhouse';
        const { name, cost } = constructionTypes[type];
        const title = `Queue a ${name.toLowerCase()}`;
        if (!visible(buildPanel)) return openPanel('#sim-build-toggle', 'Build', 'Construction', title);
        if (q<HTMLSelectElement>('#sim-type')!.value !== type) {
          return { title, instruction: `Choose ${name} in the Facility menu. This sets what you will build.`, target: '#sim-type' };
        }
        const target = '#sim-build-panel .sim-plot[data-empty="true"]:not(:disabled)';
        return visible(target)
          ? { title, instruction: `Select any empty plot to queue the ${name.toLowerCase()} for ${cost} materials. Construction begins when the clock runs.`, target }
          : { title, instruction: `An empty plot and ${cost} materials are required. You can close the tutorial and return later.` };
      }
      case 'reach-day-two': return play('Day 1 training · Start construction', 'reach Day 2. The crew walks to the plots and builds in queue order.', paused);
      case 'assign-power': {
        const title = 'Day 2 training · Assign a job';
        if (!visible(`${facilities} [data-panel="control"]`)) {
          return openPanel('[data-facility="control"]', 'Control Tower', 'crew and job controls', title);
        }
        const worker = '#worker-power';
        const button = '[data-job="power"] button';
        if (q<HTMLButtonElement>(button)?.disabled) {
          return { title, instruction: 'Open the Astronaut dropdown under Service power equipment and choose an available astronaut. The job status shows why a choice is blocked.', target: worker };
        }
        return {
          title,
          instruction: 'In Service power equipment, use the Astronaut dropdown to choose Aya Chen or another available astronaut. Press Assign job to send them to the equipment. Play lets them walk there and finish the work.',
          target: button,
        };
      }
      case 'finish-power-job': return play('Day 2 training · Finish the job', 'finish servicing the power equipment. The crew roster shows the work remaining.', paused);
      case 'reach-day-three': return play('Day 2 training · Check your progress', 'reach Day 3. Servicing the equipment has boosted solar generation.', paused);
      case 'check-forecast': {
        const title = 'Day 3 training · Check the forecast';
        return visible(`${facilities} [data-panel="comms"]`)
          ? { title, instruction: 'Select Request forecast to see when the next solar storm will arrive. The forecast tells you how much time the crew has to reach shelter.', target: '#sim-forecast' }
          : openPanel('[data-facility="comms"]', 'Communications Centre', 'forecast and survey controls', title);
      }
      case 'finish-construction': return play('Day 3 training · Finish construction', 'bring the solar array and greenhouse online before you recall the crew.', paused);
      case 'resume-work': return outpostStorm(state) === 'peak'
        ? play('Wait for the storm to clear', 'let the storm pass. Keep the astronauts in shelter until it is safe.', paused)
        : { title: 'Bring the crew back to work', instruction: 'Select Release crew to stations so the crew can finish construction and jobs.',
            target: visible(`${facilities} [data-panel="control"]`) ? '#sim-panel-shelter' : '#sim-shelter' };
      case 'dock-rover': return visible(roverPanel)
        ? { title: 'Bring the driver back', instruction: 'Drive or tow the rover to the dock, then select Dock & unload. The driver can then walk to shelter.', target: '#rover-title' }
        : openPanel('[data-surface="rover"]', 'Rover dock', 'rover controls', 'Bring the driver back');
      case 'recall-crew': {
        const title = 'Day 3 training · Practice sheltering';
        if (!visible(`${facilities} [data-panel="control"]`)) {
          return openPanel('[data-facility="control"]', 'Control Tower', 'the shelter controls', title);
        }
        return { title, instruction: 'Select Recall crew to shelter. This gives the order, and the crew will walk there while time runs.', target: '#sim-panel-shelter' };
      }
      case 'shelter-drill':
        return play(`Shelter drill · ${shelteredCount(state.campaign, true)} of 5 inside`,
          state.elapsed >= trainingEndTick ? 'give the remaining crew time to reach shelter.'
            : 'reach Day 4 with everyone in shelter. A real warning may pause the clock on the way.', paused);
      case 'complete':
        return { title: 'Challenge complete', instruction: 'You built power and food capacity, finished a job, checked a forecast, and sheltered all five astronauts. During a warning, keep the crew inside until the storm clears. Next, manage supplies and prepare for departure on Day 13.' };
    }
  }

  return {
    render(state: OutpostState, paused: boolean, show: boolean) {
      card.hidden = !show || state.outcome !== 'active' || !!state.campaign.flight;
      if (card.hidden) { spotlight.clear(); last = undefined; return; }
      const current = advice(state, paused);
      const stage = Math.min(3, 1 + Math.floor(state.elapsed / ticksPerDay));
      const day = state.training?.complete ? missionDay(state.elapsed) : `Day ${stage} of 3 · Training challenge`;
      const dayLabel = card.querySelector('[data-training-day]')!;
      if (dayLabel.textContent !== day) dayLabel.textContent = day;
      if (last?.title !== current.title) card.querySelector('h2')!.textContent = current.title;
      if (last?.instruction !== current.instruction) card.querySelector('[data-training-action]')!.textContent = current.instruction;
      last = current;
      spotlight.pointAt(current.target ? q(current.target) : null);
    },
  };
}
