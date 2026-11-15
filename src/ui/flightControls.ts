import { mountUtilityPill } from './utilityPill';
import { mountPlayerGuide } from './playerGuide';
import { launchGuide } from '../data/playerGuides';
import { cabinEvidence, artemisEvidence } from './flightEvidence';
import { commandHelp, commandPrerequisites, countdownHelp, labels, phaseCopy, phases, type FlightAction } from '../data/flightScenario';
import { flightReferences } from '../data/flightReferences';
import { commitFlight, completeLanding, landingReserve, legalActions, previewFlight, type FlightState } from '../mission/flightMission';
import { flightSave, flightSaveKey, retryCheckpoint } from '../mission/flightPersistence';
import { mountFlightScene } from '../scenes/FlightScene';
import { mountFlightRoute } from './flightRoute';
import { resourceChange } from './resourceChange';
import type { MotionPreference } from './motionPreference';
import { flightBeats, type FlightCue } from '../mission/flightPresentation';

const sections = [
  { label: 'Launch', actions: ['start', 'ground', 'avionics', 'life', 'align', 'route', 'confirm', 'onboard', 'go', 'authorize'] },
  { label: 'Flight', actions: ['depart', 'inspect', 'cool', 'thrusters', 'coast', 'isolate', 'repair', 'bypass'] },
  { label: 'Moon landing', actions: ['capture', 'checklist', 'land'] },
] as const satisfies readonly { label: string; actions: readonly FlightAction[] }[];
const decisionActions = new Set<FlightAction>(['cool', 'thrusters', 'repair', 'bypass']);

function addCommandHelp(row: HTMLElement, control: HTMLButtonElement, key: string, description: string) {
  const trigger = document.createElement('button');
  const help = document.createElement('p');
  trigger.type = 'button';
  trigger.className = 'command-help-trigger';
  trigger.textContent = 'ⓘ';
  trigger.setAttribute('aria-label', `Help for ${control.textContent}`);
  help.className = 'command-help-text';
  help.id = `flight-help-${key}`;
  help.textContent = description;
  trigger.setAttribute('aria-controls', help.id);
  const references = control.getAttribute('aria-describedby');
  control.setAttribute('aria-describedby', references ? `${references} ${help.id}` : help.id);
  let pinned = false;
  function show(visible: boolean) {
    help.hidden = !visible;
    trigger.setAttribute('aria-expanded', String(visible));
  }
  show(false);
  row.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(true); });
  row.addEventListener('pointerleave', () => { if (!pinned && !row.contains(document.activeElement)) show(false); });
  control.addEventListener('focus', () => show(true));
  row.addEventListener('focusout', event => {
    if (!pinned && !row.contains(event.relatedTarget as Node | null) && !row.matches(':hover')) show(false);
  });
  trigger.onclick = () => { pinned = !pinned; show(pinned); };
  row.addEventListener('dismiss-command-help', () => {
    pinned = false;
    show(false);
  });
  control.after(trigger);
  row.append(help);
}
const instruments = {
  life: {
    prompt: 'O₂ supply is online. Select the system that removes the crew’s exhaled CO₂.',
    options: ['Oxygen tank', 'CO₂ scrubber', 'Cabin heater'], correct: 'CO₂ scrubber',
    hint: 'The oxygen tank supplies breathing gas. The scrubber removes CO₂.',
  },
  route: {
    prompt: 'Tower route card: MOON-01. Select the matching flight computer entry.',
    options: ['TRAIN-02', 'MOON-01', 'EARTH-03'], correct: 'MOON-01',
    hint: 'The onboard entry must match the Tower route card exactly.',
  },
  inspect: {
    prompt: 'Cooling pressure is low. Select the readout that can confirm the correction engine fault.',
    options: ['Coolant loop: LOW', 'Guidance bus: READY', 'Cabin fan: RUNNING'], correct: 'Coolant loop: LOW',
    hint: 'The guidance and cabin systems read normal. Check the coolant loop.',
  },
  isolate: {
    prompt: 'Supply line A is losing pressure. Close the valve that isolates the leak while keeping the scrubber online.',
    options: ['Line A valve', 'Line B valve', 'Scrubber power'], correct: 'Line A valve',
    hint: 'Line B still holds pressure. The scrubber must stay powered.',
  },
} satisfies Partial<Record<FlightAction, { prompt: string; options: string[]; correct: string; hint: string }>>;

export function mountFlightControls(host: HTMLElement, initial: FlightState, motion: MotionPreference, audio: { flightCue: (cue: FlightCue) => void; pause: (paused: boolean) => void }, finish: (state: FlightState, unsaved: boolean) => Promise<void>, initialStored: string | null) {
  host.classList.add('flight-active');
  function dismissHelp(event: KeyboardEvent) {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    const opened = host.querySelectorAll('.flight-command:has(.command-help-trigger[aria-expanded="true"])');
    if (!opened.length) return;
    opened.forEach(row => row.dispatchEvent(new Event('dismiss-command-help')));
    event.preventDefault();
  }
  document.addEventListener('keydown', dismissHelp);
  host.setAttribute('aria-labelledby', 'flight-phase-title');
  host.innerHTML = `
    <header class="flight-heading">
      <div><p class="eyebrow">Mission Control / Earth to Moon</p><h2 id="flight-phase-title" tabindex="-1"></h2></div>
      <div class="flight-resources" aria-label="Flight reserves in training units"></div>
      <div class="flight-utilities"></div>
    </header>
    <div class="flight-layout">
      <section class="flight-console console" aria-label="Mission operations">
        <div class="flight-panel-title"><h3>Mission operations</h3><span>COMMAND</span></div>
        <ol class="flight-sections" aria-label="Mission sections"></ol>
        <dl class="flight-telemetry" aria-label="Simulated telemetry">
          <div><dt>Mission elapsed</dt><dd data-met></dd></div>
          <div><dt>Velocity</dt><dd data-speed></dd></div>
          <div><dt>Earth range</dt><dd data-range></dd></div>
          <div><dt>Flight status</dt><dd data-flight-status></dd></div>
        </dl>
        <div class="flight-readback">
          <div class="flight-radio"><img alt="" width="36" height="36"><strong></strong></div>
          <p class="flight-caption" role="status"></p><p class="flight-notice" role="status"></p>
          <div class="flight-exercise"></div>
        </div>
        <p class="flight-countdown"></p><p class="flight-reserve"></p>
        <button class="radio-action launch-guide-trigger" type="button" data-launch-guide aria-haspopup="dialog">Launch briefing</button>
        <div class="flight-actions" role="group" aria-label="Mission commands"></div>
        <div class="flight-secondary"></div>
        <details class="flight-science"><summary>Science and simulation</summary><p>Telemetry is illustrative and time is compressed. Fuel, battery and breathing supply are measured in training units. Commands spend resources only when committed.</p></details>
      </section>
      <div class="flight-visuals">
        <section class="flight-stage" aria-label="Exterior camera">
          <div class="flight-panel-title"><h3>Exterior camera</h3><span data-camera-status></span></div>
          <div class="flight-stage-picture"><div class="flight-scene"></div><div class="flight-window-label" aria-hidden="true"><span>VEHICLE TRACKING</span><strong data-clock></strong></div></div>
        </section>
        <section class="flight-map console" aria-label="Mission trajectory">
          <div class="flight-panel-title"><h3>Mission trajectory</h3><span>SIM</span></div>
          <div class="flight-map-body">
            <div class="flight-route"></div>
            <div class="flight-map-details">
              <p class="flight-map-legend"><span>● Spacecraft</span><span>◆ Checkpoint</span></p>
              <div class="flight-artemis"></div><div class="flight-incident-log"></div>
            </div>
          </div>
        </section>
      </div>
    </div>`;
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => host.querySelector<T>(selector)!;
  const briefing = mountPlayerGuide(host, 'flight-player-guide');
  const briefingTrigger = q<HTMLButtonElement>('[data-launch-guide]');
  briefingTrigger.onclick = () => briefing.show(launchGuide, briefingTrigger);
  const scene = mountFlightScene(q('.flight-scene'));
  const updateRoute = mountFlightRoute(q('.flight-route'), q('.flight-telemetry'));
  q('.flight-artemis').innerHTML = artemisEvidence();
  for (const ref of flightReferences) {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = ref.url;
    link.textContent = ref.title;
    link.target = '_blank';
    link.rel = 'noopener';
    p.append(ref.fact + ' ', link);
    q('.flight-science').append(p);
  }
  let state = initial;
  let stored = initialStored;
  let lastResources = initial.resources;
  const preferences = document.createElement('div'); preferences.className = 'console';
  preferences.innerHTML = '<button class="radio-action" data-pause>Pause flight</button><button class="radio-action" data-motion>Reduce motion</button><button class="radio-action" data-sound>Sound</button>';
  mountUtilityPill(host.querySelector<HTMLElement>('.flight-utilities')!, preferences);
  let paused = document.hidden;
  let stale = false, unsaved = false, busy = false;
  let notice = '';
  let feedback = initial.pendingReport ?? (initial.actionJournal.at(-1)?.action === 'acknowledge' ? initial.reports.at(-1)?.text ?? '' : '');
  let exercise: keyof typeof instruments | 'checklist' | undefined;
  let elapsed = 0, previous = 0, telemetryAt = -1, frame = 0;

  function makeButton(label: string, action: () => void, disabled = false) {
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'radio-action';
    control.textContent = label;
    control.disabled = disabled;
    control.onclick = action;
    return control;
  }

  function persist(next: FlightState) {
    try {
      if (localStorage.getItem(flightSaveKey) !== stored) {
        stale = true;
        notice = 'Flight changed in another tab. Reload to continue.';
        return false;
      }
      const raw = JSON.stringify(flightSave(next));
      localStorage.setItem(flightSaveKey, raw);
      stored = raw;
    } catch {
      unsaved = true;
      notice = 'Unsaved play · storage is unavailable. Keep this tab open.';
    }
    if (state.phase !== next.phase || next.actionJournal.length < state.actionJournal.length) elapsed = 0;
    if (Object.keys(state.resources).some(key => state.resources[key as keyof typeof state.resources] !== next.resources[key as keyof typeof state.resources])) lastResources = state.resources;
    state = next;
    return true;
  }

  function settleReadback(next: FlightState) {
    if (!next.pendingReport) return next;
    // Keep the acknowledgment entry for replaying existing flight journals.
    const index = next.actionJournal.length;
    return commitFlight(next, { id: `${next.runId}/${index}/acknowledge`, action: 'acknowledge' })!;
  }

  function act(action: FlightAction, expected = state.actionJournal.length) {
    if (paused || stale || busy || expected !== state.actionJournal.length) return;
    const next = commitFlight(state, { id: `${state.runId}/${expected}/${action}`, action });
    if (!next) return;
    if (!persist(settleReadback(next))) { render(); return; }
    if (action === 'authorize') elapsed = 0;
    feedback = next.pendingReport ?? '';
    if (!unsaved) notice = '';
    exercise = undefined;
    const cues: Partial<Record<FlightAction, FlightCue>> = {
      orbit: 'staging', ignite: 'ignition', align: 'warning', inspect: 'warning', isolate: 'warning',
      ground: 'power', avionics: 'boot', life: 'fan', go: 'clearance', touchdown: 'touchdown',
      depart: 'burn', capture: 'burn', land: 'burn',
    };
    audio.flightCue(cues[action] ?? 'confirmation');
    render();
  }

  async function handoff() {
    if (busy || stale) return;
    const completed = completeLanding(state);
    if (!completed) return;
    if (completed !== state && !persist(completed)) { render(); return; }
    busy = true;
    try {
      audio.pause(false);
      await finish(state, unsaved);
      scene.dispose();
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', dismissHelp);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('storage', storage);
      motion.changes.removeEventListener('change', motionChanged);
    } catch (error) {
      if (error instanceof DOMException && ['QuotaExceededError', 'SecurityError'].includes(error.name)) unsaved = true;
      notice = error instanceof Error ? error.message : 'Could not enter the outpost. Retry or reload.';
      busy = false;
      render();
    }
  }

  function tick(now: number) {
    frame = requestAnimationFrame(tick);
    const seconds = previous ? (now - previous) / 1000 : 0;
    previous = now;
    const running = !paused && !briefing.open && !busy && !stale && !document.hidden;
    if (running) elapsed += Math.min(seconds, .1);
    const beat = flightBeats[state.phase];
    const countdown = state.phase === 'countdown' && state.startupSystems.includes('authorize');
    scene.update({ phase: state.phase, reduced: motion.reduced, paused: !running, elapsed });
    if (now - telemetryAt >= 100) {
      telemetryAt = now;
      updateRoute(state.phase, beat && !motion.reduced ? Math.min(1, elapsed / beat.seconds) : 0);
      const clock = countdown ? `T−${Math.max(0, Math.ceil(10 - elapsed))}` : '';
      q('[data-clock]').textContent = clock;
      q('.flight-countdown').textContent = clock ? `${paused ? 'HOLD' : 'COUNTDOWN'} · ${clock}` : '';
    }
    if (!running) return;
    if (countdown && elapsed >= 10) act('ignite');
    else if (beat && !motion.reduced && elapsed >= beat.seconds) act(beat.next);
  }

  function renderExercise(blocked: boolean) {
    const panel = q('.flight-exercise');
    panel.replaceChildren();
    if (!exercise) return;
    const item = exercise;
    if (item === 'checklist') {
      const label = document.createElement('label');
      label.textContent = 'Trim descent guidance to the target band (48–52).';
      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0'; input.max = '100'; input.value = '25'; input.disabled = blocked;
      const output = document.createElement('output');
      const confirm = makeButton('Lock descent guidance', () => act('checklist'));
      const read = () => {
        const aligned = Math.abs(input.valueAsNumber - 50) <= 2;
        output.textContent = aligned ? `${input.value} · Aligned` : `${input.value} · Adjust trim`;
        output.dataset.change = aligned ? 'gain' : 'loss';
        confirm.disabled = blocked || !aligned;
      };
      input.oninput = read;
      label.append(input, output);
      panel.append(label, confirm);
      read();
    } else {
      const data = instruments[item];
      const prompt = document.createElement('p');
      prompt.textContent = data.prompt;
      const options = document.createElement('div');
      options.className = 'flight-exercise-options';
      panel.append(prompt, options);
      for (const option of data.options) options.append(makeButton(option, () => {
        if (option === data.correct) act(item);
        else {
          notice = data.hint;
          q('.flight-notice').textContent = notice;
        }
      }, blocked));
      if (item === 'life') panel.insertAdjacentHTML('beforeend', cabinEvidence());
    }
    panel.append(makeButton('Return to console', () => { exercise = undefined; render(); }));
  }

  function render(focus = true) {
    const [title, speaker, line] = phaseCopy[state.phase];
    const phaseIndex = phases.indexOf(state.phase);
    const stage = phaseIndex <= phases.indexOf('ascent') ? 0 : phaseIndex < phases.indexOf('lunarOrbit') ? 1 : 2;
    briefingTrigger.hidden = stage !== 0;
    const blocked = paused || stale || busy;
    q('h2').textContent = title;
    q('[data-camera-status]').textContent = paused ? 'HOLD' : sections[stage].label.toUpperCase();
    q('.flight-caption').textContent = paused && state.phase !== 'debrief' && state.phase !== 'outpost' ? 'Flight paused. Resume when ready.' : state.pendingReport ?? (feedback || line);
    q('.flight-notice').textContent = notice;
    q('.flight-radio strong').textContent = state.pendingReport || feedback ? 'Mission update' : `${speaker} / CREW RADIO`;
    const portrait = q<HTMLImageElement>('.flight-radio img');
    portrait.hidden = ['Tower', 'Pilot'].includes(speaker);
    if (!portrait.hidden) portrait.src = `/media/crew-${speaker.toLowerCase()}.webp`;
    q('.flight-sections').replaceChildren(...sections.map(({ label }, index) => {
      const step = document.createElement('li');
      step.textContent = label;
      if (index === stage) step.setAttribute('aria-current', 'step');
      return step;
    }));
    q('.flight-resources').replaceChildren(...Object.entries(state.resources).map(([name, value]) => {
      const key = name as keyof typeof state.resources;
      const card = document.createElement('div');
      const caption = document.createElement('span');
      caption.textContent = name;
      const reading = document.createElement('strong');
      reading.textContent = String(value);
      reading.dataset.change = value < lastResources[key] ? 'loss' : value > lastResources[key] ? 'gain' : 'steady';
      card.append(caption, reading);
      if (lastResources[key] !== value) card.append(resourceChange(name, lastResources[key], value));
      return card;
    }));
    const reports = state.reports.filter(report => decisionActions.has(report.action));
    q('.flight-incident-log').replaceChildren(...reports.map(report => {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = labels[report.action] + ' · report';
      const text = document.createElement('p');
      text.textContent = report.text;
      details.append(summary, text);
      return details;
    }));
    const actions = q('.flight-actions');
    const legal = legalActions(state);
    const sequence = state.actionJournal.length;
    const landed = state.phase === 'debrief' || state.phase === 'outpost';
    const board: readonly FlightAction[] = landed ? [] : sections[stage].actions;
    actions.replaceChildren(...board.map(action => {
      const row = document.createElement('div');
      row.className = 'flight-command';
      const done = state.startupSystems.includes(action);
      const alternative = (['cool', 'thrusters'].includes(action) && ['cool', 'thrusters'].some(a => state.startupSystems.includes(a as FlightAction)))
        || (['repair', 'bypass'].includes(action) && ['repair', 'bypass'].some(a => state.startupSystems.includes(a as FlightAction)));
      const preview = legal.includes(action) ? previewFlight(state, action) : undefined;
      const control = makeButton(labels[action], () => {
        if (Object.hasOwn(instruments, action) || action === 'checklist') {
          exercise = action as typeof exercise;
          render();
        } else act(action, sequence);
      }, blocked || Boolean(exercise) || !preview?.allowed);
      const status = document.createElement('small');
      status.id = `flight-command-${action}-status`;
      control.setAttribute('aria-describedby', status.id);
      const missing = (commandPrerequisites[action] ?? []).filter(item => !state.startupSystems.includes(item));
      status.textContent = done ? '✓ Done' : alternative ? 'Unused' : exercise === action ? 'Options open'
        : preview?.allowed && !blocked && !exercise ? 'Ready' : preview && !preview.allowed ? 'Reserve lock'
          : missing.length ? `First complete “${labels[missing[0]]}”` : exercise ? 'Finish the open exercise'
            : action === 'capture' ? 'First finish the Moon approach' : 'Available at the next flight check';
      row.dataset.command = done ? 'done' : preview?.allowed ? 'ready' : 'locked';
      row.append(control, status);
      if (preview?.allowed) {
        const charges = document.createElement('div');
        charges.className = 'flight-charges';
        for (const key of Object.keys(state.resources) as (keyof typeof state.resources)[]) {
          if (state.resources[key] !== preview.next.resources[key]) charges.append(resourceChange(key, state.resources[key], preview.next.resources[key]));
        }
        if (charges.childElementCount) {
          charges.id = `flight-command-${action}-cost`;
          control.setAttribute('aria-describedby', `${status.id} ${charges.id}`);
          row.append(charges);
        }
      } else if (preview) {
        const reason = document.createElement('p');
        reason.className = 'command-block-reason';
        reason.textContent = preview.reason;
        reason.id = `flight-command-${action}-reason`;
        control.setAttribute('aria-describedby', `${status.id} ${reason.id}`);
        row.append(reason);
      }
      const help = commandHelp[action];
      if (help) addCommandHelp(row, control, action, help);
      return row;
    }));
    renderExercise(blocked);
    const secondary = q('.flight-secondary');
    secondary.replaceChildren();
    const beat = flightBeats[state.phase];
    if (beat) secondary.append(makeButton(motion.reduced ? 'Continue' : 'Skip animation', () => act(beat.next, sequence), blocked));
    if (state.phase === 'countdown' && state.startupSystems.includes('authorize')) {
      const row = document.createElement('div');
      row.className = 'flight-command';
      const hold = makeButton(paused ? 'Resume countdown' : 'Hold countdown', togglePause, stale);
      row.append(hold);
      addCommandHelp(row, hold, 'countdown', countdownHelp);
      secondary.append(row);
    }
    const checkpoint = retryCheckpoint(state);
    if (checkpoint && state.phase !== 'outpost') secondary.append(makeButton('Retry checkpoint', () => {
      if (persist(checkpoint)) { feedback = ''; exercise = undefined; render(); }
    }, blocked));
    if (landed) {
      const enterOutpost = makeButton(unsaved ? 'Enter outpost without saving' : 'Enter lunar outpost', () => void handoff(), stale || busy);
      enterOutpost.className = 'action';
      secondary.prepend(enterOutpost);
    }
    const reserve = landingReserve(state);
    q('.flight-reserve').textContent = `Landing reserve · ${reserve.fuel} fuel / ${reserve.battery} battery / ${reserve.oxygen} oxygen`;
    q('[data-pause]').textContent = paused ? 'Resume flight' : 'Pause flight';
    q('[data-motion]').setAttribute('aria-pressed', String(motion.reduced));
    telemetryAt = -1;
    if (focus) {
      const target = exercise ? q('.flight-exercise').querySelector<HTMLElement>('input, button')
        : q('.flight-actions').querySelector<HTMLElement>('button:not(:disabled)') ?? q('.flight-secondary').querySelector<HTMLElement>('button:not(:disabled)');
      (target ?? q('h2')).focus({ preventScroll: true });
    }
  }
  function togglePause() { paused = !paused; audio.pause(paused); render(false); }
  q('[data-pause]').onclick = togglePause;
  q('[data-motion]').onclick = () => document.querySelector<HTMLButtonElement>('#reduce-motion')!.click();
  const mute = document.querySelector<HTMLButtonElement>('#mute')!;
  q('[data-sound]').textContent = mute.textContent;
  q('[data-sound]').onclick = () => { mute.click(); q('[data-sound]').textContent = mute.textContent; };
  function visibility() { if (document.hidden && !paused) togglePause(); }
  function storage(event: StorageEvent) {
    if ((event.key === flightSaveKey || event.key === null) && event.newValue !== stored) {
      stale = true;
      notice = 'Flight changed in another tab. Reload to continue.';
      render(false);
    }
  }
  function motionChanged() { render(false); }
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('storage', storage);
  motion.changes.addEventListener('change', motionChanged);
  if (state.pendingReport) persist(settleReadback(state));
  if (paused) audio.pause(true);
  render();
  if (initial.phase === 'briefing') briefing.showOnce(launchGuide, briefingTrigger);
  frame = requestAnimationFrame(tick);
}
