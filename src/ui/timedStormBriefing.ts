import { crew } from '../data/crew';
import { archivedSolarEvent } from '../data/archivedSolarEvent';
import { shelteredCount } from '../mission/lunarCampaign';
import { outpostForecast, departureCountdown, rates, resourceDeltas, type OutpostState } from '../mission/outpostSimulation';
import type { MotionPreference } from './motionPreference';

const poster = '/media/particle-alert-poster.webp';
const animation = '/media/particle-alert.gif';

export function mountTimedStormBriefing(
  host: HTMLElement, motion: MotionPreference, getState: () => OutpostState,
  changed: () => void, openRover: () => void, fallbackFocus: HTMLElement,
) {
  const dialog = document.createElement('dialog');
  dialog.className = 'console mission-dialog timed-alert';
  dialog.setAttribute('aria-labelledby', 'timed-storm-title');
  dialog.innerHTML = `
    <header><h2 id="timed-storm-title" tabindex="-1"></h2><button class="icon-button" aria-label="Close storm briefing">×</button></header>
    <h3>What happened?</h3>
    <p>Energetic particles from the Sun can expose astronauts outside shelter. STEREO-A observed the particle event that inspired this drill.</p>
    <details><summary>See the training illustration and archived observation</summary>
      <figure><img alt="Training illustration showing a rising particle trace and astronauts inside a shielded shelter.">
      <figcaption>Training illustration. Archive record: STEREO-A · 11 May 2024, 04:07 UTC · NASA CCMC DONKI.</figcaption></figure>
      <button class="radio-action" data-animation></button>
      <p><a href="${archivedSolarEvent.sourceUrl}" target="_blank" rel="noopener noreferrer">NASA event archive</a> · <a href="https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/" target="_blank" rel="noopener noreferrer">NASA on radiation protection</a></p>
    </details>
    <h3>At the outpost</h3>
    <p data-conditions></p><p data-reserves></p>
    <p>During the simulated peak, the arrays generate 30% of normal power. Shelter ventilation uses power. Turning off greenhouse lights saves power and pauses crop growth.</p>
    <h3>What you can do</h3>
    <p data-driver></p><div class="campaign-actions">
      <button class="action" data-recall>Recall crew</button>
      <button class="radio-action" data-rover-controls>Open rover controls</button>
    </div>
    <p>Use Play to advance time after closing the briefing.</p>`;
  host.append(dialog);
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
  const image = q<HTMLImageElement>('img');
  const toggle = q<HTMLButtonElement>('[data-animation]');
  const archive = q<HTMLDetailsElement>('details');
  const recall = q<HTMLButtonElement>('[data-recall]');
  const rover = q<HTMLButtonElement>('[data-rover-controls]');
  let paused = false;
  let animationFailed = false;
  let posterFailed = false;
  let caller: HTMLElement | null;
  let stormId: number;
  let toRover = false;

  function updateMedia() {
    if (!dialog.open || !archive.open) return;
    const playing = !paused && !motion.reduced && !animationFailed;
    const src = playing ? animation : poster;
    image.hidden = !playing && posterFailed;
    if (!image.hidden && image.getAttribute('src') !== src) image.src = src;
    toggle.hidden = motion.reduced || animationFailed;
    toggle.textContent = playing ? 'Pause illustration' : 'Play illustration';
  }
  image.onerror = () => {
    if (image.getAttribute('src') === animation) animationFailed = true;
    if (image.getAttribute('src') === poster) posterFailed = true;
    updateMedia();
  };
  archive.ontoggle = updateMedia;
  toggle.onclick = () => { paused = !paused; updateMedia(); };
  motion.changes.addEventListener('change', updateMedia);

  function refresh() {
    const state = getState();
    const storm = outpostForecast(state);
    if (!storm) return;
    const driver = crew.find(person => person.id === state.campaign.rover.driver);
    const inside = shelteredCount(state.campaign, state.sheltered);
    q('[data-conditions]').textContent = `${state.elapsed < storm.start ? `Peak begins in ${departureCountdown(storm.start - state.elapsed)}` : `Peak clears in ${departureCountdown(storm.end - state.elapsed)}`}. ${inside} of ${crew.length} in shelter.`;
    const batteryChange = resourceDeltas(rates(state), rates({ ...state, sheltered: true }), '/day');
    q('[data-reserves]').textContent = `${state.battery.toFixed(1)} power · ${state.oxygen.toFixed(1)} oxygen${batteryChange ? ` · Recall changes rates by ${batteryChange}` : ''}.`;
    q('[data-driver]').textContent = driver
      ? `${driver.name} is ${state.campaign.rover.rescue ? 'awaiting rover recovery' : 'driving'}. Bring the rover back and dock to release its driver.`
      : 'The rover is docked. Recall the crew and give them time to walk to shelter.';
    recall.disabled = state.sheltered;
    recall.textContent = state.sheltered ? 'Recall ordered' : 'Recall crew';
    rover.hidden = !driver;
  }
  recall.onclick = () => {
    const state = getState();
    state.sheltered = true;
    state.message = 'Crew recalled to shelter. Press Play to give them time to reach it.';
    changed();
    refresh();
  };
  rover.onclick = () => { toRover = true; dialog.close(); };
  q('.icon-button').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    const campaign = getState().campaign;
    const acknowledged = campaign.stormAcknowledged ??= [];
    if (!acknowledged.includes(stormId)) acknowledged.push(stormId);
    changed();
    if (toRover) openRover();
    else (caller && caller !== document.body && caller.getClientRects().length ? caller : fallbackFocus).focus();
  });
  return {
    show(id: number, peak: boolean) {
      if (document.querySelector('dialog[open]')) return;
      stormId = id;
      toRover = false;
      paused = false;
      caller = document.activeElement as HTMLElement | null;
      archive.open = id === 1;
      const title = q('#timed-storm-title');
      title.textContent = peak ? 'Solar storm active' : id === 1 ? 'Solar particle storm warning' : 'Second solar storm warning';
      refresh();
      dialog.showModal();
      dialog.scrollTop = 0;
      title.focus();
      updateMedia();
    },
  };
}
