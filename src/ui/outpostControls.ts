import { mountTowerTelemetry } from './towerTelemetry';
import { mountMissionDialog } from './missionDebrief';
import { mountCampaignControls } from './campaignControls';
import { driveStep, stepRover, stormSchedule } from '../mission/lunarCampaign';
import { mountUtilityPill } from './utilityPill';
import { daysRemaining, missionDay, setFacilityEnabled, buildFacility, constructionTypes, newOutpost, isLandedOutpostKey, lastLandedOutpostKey, parseOutpost, plots, rates, stepOutpost, stormAt, type FacilityType, type OutpostState } from '../mission/outpostSimulation';
import { buildings, type Building } from '../data/buildings';

export function mountTimedOutpost(updateScene: (state: OutpostState, driving?: boolean) => void, pauseAudio: (paused: boolean) => void, saveKey: string | null, selectBuilding: (id?: Building['id']) => void) {
  let state = newOutpost();
  let storageStatus = saveKey ? '' : 'Unsaved play · browser storage is unavailable.';
  if (saveKey) {
    try {
      const raw = localStorage.getItem(saveKey);
      if (raw) {
        const saved = parseOutpost(raw);
        if (saved) state = saved;
        else storageStatus = 'Previous timed save was unreadable. Started fresh.';
      }
    } catch { storageStatus = 'Storage unavailable: this session cannot be saved.'; }
  }
  let selected: Building['id'] | number | undefined;
  let panelTrigger: HTMLElement | null = null;
  let paused = true, speed = 1, accumulator = 0, last = performance.now();
  const workspace = document.querySelector<HTMLElement>('#mission-workspace')!;
  const tools = workspace.querySelector('.hud-tools')!;
  for (const child of Array.from(workspace.children)) (child as HTMLElement).hidden = true;
  const ui = document.createElement('section'); ui.className = 'timed-outpost';
  ui.innerHTML = `<header class="sim-topline"><div class="sim-brand"><p class="eyebrow">Lunar outpost</p><h1>Establish the base</h1></div><div class="sim-clock console" aria-label="Mission clock"><strong id="sim-time"></strong><button class="clock-play" id="sim-play" title="Play simulation" aria-label="Play simulation">▶</button><button id="sim-speed" class="clock-speed" title="Change speed" aria-label="Speed 1×. Click to cycle to 2×">1×</button></div><div class="sim-utilities"></div></header>
  <section class="sim-resources console" aria-label="Live resources"></section>
  <nav class="sim-facility-nav" aria-label="Manage facilities">${buildings.map(b => `<button class="radio-action" data-open-building="${b.id}" aria-controls="sim-facility-panel" aria-expanded="false">${b.name}</button>`).join('')}<button class="radio-action" id="sim-build-toggle" aria-expanded="false" aria-controls="sim-build-panel">＋ Build</button><button class="radio-action" id="sim-open-rover">Rover</button><button class="radio-action" id="sim-open-departure">Departure</button><button class="radio-action" id="sim-quick-recall" hidden>Recall crew</button></nav>
  <section id="sim-facility-panel" class="console sim-facility-panel" aria-labelledby="sim-facility-title" hidden><header><div><p class="eyebrow">Facility controls</p><h2 id="sim-facility-title" tabindex="-1"></h2></div><button class="icon-button" id="sim-close-facility" aria-label="Close facility">×</button></header><p id="sim-facility-detail"></p><div data-panel="farm"><label><input type="checkbox" id="sim-grow-lights"> Run greenhouse lights</label><p>Each active greenhouse produces 3 food/day and consumes 2 power and 0.5 water/day. Turning off lights suspends growth.</p><label><input type="checkbox" id="sim-recycler"> Run water recycler</label><p>Recycling uses 1 power/day and recovers 1.8 water/day before crew consumption.</p></div><div data-panel="control"><button id="sim-telemetry" class="radio-action">Request telemetry</button><button id="sim-panel-shelter" class="radio-action"></button><label><input type="checkbox" id="sim-reserve-air"> Use reserve oxygen</label><p>Reserve mode saves 1 power/day but consumes 3 oxygen/day. Normal life support replenishes oxygen while powered.</p></div><div data-panel="comms"><p>Track particle activity and survey for supplies.</p><button id="sim-comms-telemetry" class="radio-action">Request telemetry</button><button class="radio-action" id="sim-forecast">Request forecast</button><p id="sim-forecast-result" role="status"></p></div><div data-panel="expansion"><label><input type="checkbox" id="sim-facility-enabled"> Facility online</label><p id="sim-expansion-info"></p></div></section>
  <div class="sim-bottom"><section class="console sim-operations"><p class="eyebrow">Mission control</p><h2 id="sim-phase"></h2><p id="sim-event" role="status"></p><button id="sim-shelter" class="radio-action"></button><p id="sim-crew"></p><p id="sim-save" role="status"></p><details><summary>How to establish the outpost</summary><p>Build a solar array and greenhouse, then manage reserves through the storm. One construction team uses two of five astronauts; the other three maintain life support. Recall the crew before each storm. Survive fifteen full mission days and use the Departure checklist to prepare the return ship.</p><p>One mission day passes in 60 real seconds at 1×. Resource units and timing are fictional training values. Pausing also stops resource consumption and construction.</p></details><button id="sim-restart" class="radio-action">New outpost</button><button id="sim-loss-report" class="radio-action" hidden>Mission report</button><button id="sim-menu" class="radio-action">Chapter menu</button></section>
  <section id="sim-build-panel" class="console sim-build" hidden><p class="eyebrow">Expand the base</p><h2>Construction</h2><label for="sim-type">Facility</label><select id="sim-type">${Object.entries(constructionTypes).map(([key, f]) => `<option value="${key}">${f.name} · ${f.cost} materials</option>`).join('')}</select><p id="sim-build-info"></p><p>Select an empty plot to queue construction.</p><div class="sim-plots"></div><p id="sim-build-error" role="status"></p></section></div>`;
  workspace.append(ui);
  const preferences = tools.querySelector<HTMLElement>('.sound-sliders')!;
  preferences.prepend(tools.querySelector('#mute')!);
  mountUtilityPill(ui.querySelector<HTMLElement>('.sim-utilities')!, preferences);
  tools.remove();
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => ui.querySelector<T>(selector)!;
  const button = q<HTMLButtonElement>('#sim-play');
  mountTowerTelemetry(q('#sim-telemetry'), workspace, () => state);
  q('#sim-comms-telemetry').onclick = () => q('#sim-telemetry').click();
  const stormVisual = document.createElement('div');
  stormVisual.className = 'storm-visual';
  stormVisual.setAttribute('aria-hidden', 'true');
  stormVisual.hidden = true;
  for (let index = 0; index < 20; index++) {
    const particle = document.createElement('span');
    particle.style.setProperty('--x', `${(index * 43) % 133 - 15}%`);
    particle.style.setProperty('--y', `${(index * 29) % 100}vh`);
    particle.style.setProperty('--duration', `${2.3 + index % 5 * .61}s`);
    particle.style.setProperty('--delay', `-${index * .87}s`);
    stormVisual.append(particle);
  }
  document.querySelector('#outpost-canvas')!.append(stormVisual);

  const campaign = mountCampaignControls(ui, () => state, () => {
    if (state.campaign.flight) setPaused(true);
    else { save(); render(); }
  }, driving => {
    updateScene(state, driving);
    updateSpeed();
  }, panel => {
    closeFacility(false);
    q('#sim-build-panel').hidden = true;
    q('#sim-build-toggle').setAttribute('aria-expanded','false');
    campaign.show(panel);
  });
  function updateSpeed() {
    const control = q<HTMLButtonElement>('#sim-speed');
    const driving = campaign.driving;
    control.disabled = driving || state.outcome !== 'active';
    control.title = driving ? 'Park and leave driving view to use fast-forward' : 'Change simulation speed';
    control.textContent = driving ? '1×' : `${speed}×`;
    control.setAttribute('aria-label', driving ? 'Speed locked at 1× in driving view' : `Speed ${speed}×. Click to cycle to ${speed === 4 ? 1 : speed * 2}×`);
  }

  const resourceNodes = ['battery','food','water','oxygen','materials'].map(key => {
    const el = document.createElement('article'); el.innerHTML = `<span>${key}</span><strong></strong><small></small>`; q('.sim-resources').append(el); el.dataset.previous = String(state[key as keyof typeof state]); return { key: key as 'battery'|'food'|'water'|'oxygen'|'materials', el };
  });
  const plotButtons = plots.map((_, index) => { const b = document.createElement('button'); b.className = 'sim-plot'; b.onclick = () => {
    if (state.facilities.some(f => f.plot === index)) { openFacility(index); return; }
    q('#sim-build-error').textContent = buildFacility(state, q<HTMLSelectElement>('#sim-type').value as FacilityType, index) ?? '';
    save(); render();
  }; q('.sim-plots').append(b); return b; });
  function save() {
    if (!saveKey) return;
    try { localStorage.setItem(saveKey, JSON.stringify(state)); }
    catch { storageStatus = 'Storage unavailable: progress is not saved.'; }
  }
  function setPaused(value: boolean) { paused = value; if (paused) state.campaign.rover.velocity = state.campaign.rover.steering = 0; campaign.clearInput(); last = performance.now(); pauseAudio(value); save(); render(); }
  button.onclick = () => setPaused(!paused);
  q('#sim-speed').onclick = () => { speed = speed === 4 ? 1 : speed * 2; updateSpeed(); };
  ui.querySelectorAll<HTMLButtonElement>('[data-open-building]').forEach(b => b.onclick = () => openFacility(b.dataset.openBuilding as Building['id']));
  function closeFacility(restoreFocus = true) { selected = undefined; selectBuilding(undefined); q('#sim-facility-panel').hidden = true; ui.querySelectorAll('[data-open-building]').forEach(b => b.setAttribute('aria-expanded', 'false')); if (restoreFocus) panelTrigger?.focus(); }
  q('#sim-close-facility').onclick = () => closeFacility();
  q('#sim-facility-panel').addEventListener('keydown', event => { if (event.key === 'Escape') closeFacility(); });
  q('#sim-build-toggle').onclick = () => { const panel = q('#sim-build-panel'); panel.hidden = !panel.hidden; q('#sim-build-toggle').setAttribute('aria-expanded', String(!panel.hidden)); if (!panel.hidden) { campaign.close(); closeFacility(false); } };
  function openFacility(id: Building['id'] | number) {
    campaign.close();
    selected = id; panelTrigger = document.activeElement as HTMLElement;
    selectBuilding(typeof id === 'string' ? id : undefined);
    q('#sim-build-panel').hidden = true; q('#sim-build-toggle').setAttribute('aria-expanded', 'false');
    q('#sim-facility-panel').hidden = false;
    ui.querySelectorAll<HTMLElement>('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== (typeof id === 'number' ? 'expansion' : id));
    ui.querySelectorAll<HTMLButtonElement>('[data-open-building]').forEach(b => b.setAttribute('aria-expanded', String(b.dataset.openBuilding === id)));
    render(); q('#sim-facility-title').focus();
  }
  for (const [selector, key] of [['#sim-grow-lights','growLights'], ['#sim-recycler','recycler'], ['#sim-reserve-air','reserveAir']] as const) {
    q<HTMLInputElement>(selector).onchange = () => { if (state.outcome !== 'active') return; state[key] = q<HTMLInputElement>(selector).checked; save(); render(); };
  }
  q<HTMLInputElement>('#sim-facility-enabled').onchange = () => { if (typeof selected === 'number') setFacilityEnabled(state, selected, q<HTMLInputElement>('#sim-facility-enabled').checked); save(); render(); };
  q('#sim-forecast').onclick = () => {
    const window = stormSchedule(state.elapsed, state.campaign.safetyChecked);
    const forecast = q('#sim-forecast-result');
    forecast.classList.remove('forecast-received');
    void forecast.offsetWidth;
    forecast.textContent = window && state.elapsed < window.start
      ? `Next storm in ${daysRemaining(window.start - state.elapsed)}. Solar output falls to 30%.`
      : window ? `Particle storm clears in ${daysRemaining(window.end - state.elapsed)}.` : 'Clear conditions for the rest of the surface campaign.';
    forecast.classList.add('forecast-received');
  };
  q('#sim-quick-recall').onclick = () => q('#sim-shelter').click();
  q('#sim-panel-shelter').onclick = () => q('#sim-shelter').click();
  q<HTMLSelectElement>('#sim-type').onchange = render;
  q('#sim-shelter').onclick = () => { state.sheltered = !state.sheltered; save(); render(); };
  let reportedLoss: OutpostState | undefined;
  let resumeAfterDialog = false;
  const missionDialog = mountMissionDialog(workspace, () => {
    state = newOutpost();
    campaign.close();
    closeFacility(false);
    accumulator = 0;
    setPaused(true);
    button.focus();
  }, () => {
    const resume = resumeAfterDialog;
    resumeAfterDialog = false;
    if (resume && !document.hidden && state.outcome === 'active') setPaused(false);
  });
  q('#sim-restart').onclick = () => {
    resumeAfterDialog = !paused;
    if (!paused) setPaused(true);
    missionDialog.show(undefined);
  };
  q('#sim-loss-report').onclick = () => missionDialog.show(state);
  q('#sim-menu').onclick = () => { save(); location.reload(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
  window.addEventListener('pagehide', save);
  function render() {
    const flow = rates(state); const phase = stormAt(state.elapsed, state.campaign.safetyChecked);
    const forecast = stormSchedule(state.elapsed, state.campaign.safetyChecked);
    stormVisual.hidden = phase !== 'warning' && phase !== 'peak';
    stormVisual.dataset.phase = phase;
    q('#sim-loss-report').hidden = state.outcome !== 'failed';
    if (state.outcome === 'failed' && reportedLoss !== state) {
      reportedLoss = state;
      missionDialog.show(state);
    }
    q('#sim-time').textContent = missionDay(state.elapsed);
    button.textContent = paused ? '▶' : 'Ⅱ'; button.disabled = state.outcome !== 'active'; button.setAttribute('aria-pressed', String(!paused)); button.setAttribute('aria-label', paused ? 'Play simulation' : 'Pause simulation'); button.title = paused ? 'Play simulation' : 'Pause simulation';
    q('#sim-phase').textContent = state.outcome === 'ready' ? 'Crew recovered' : state.outcome === 'failed' ? 'Mission interrupted' : phase === 'warning' && forecast ? `Storm in ${daysRemaining(forecast.start - state.elapsed)}` : phase === 'peak' && forecast ? `Solar storm active · ${daysRemaining(forecast.end - state.elapsed)} left` : forecast ? `Warning in ${daysRemaining(forecast.warning - state.elapsed)}` : 'Clear · prepare for departure';
    q('#sim-quick-recall').hidden = state.outcome !== 'active' || state.sheltered || (phase !== 'warning' && phase !== 'peak');
    q('#sim-event').textContent = state.message.replace('60 seconds', '1 day');
    q<HTMLButtonElement>('#sim-shelter').textContent = state.sheltered ? 'Release crew to stations' : 'Recall crew to shelter';
    q<HTMLButtonElement>('#sim-shelter').disabled = state.outcome !== 'active';
    q('#sim-save').textContent = storageStatus || (paused ? 'Paused · saved locally' : 'Running · autosave enabled');
    for (const {key,el} of resourceNodes) {
      const rateNow = key === 'materials' ? 0 : flow[key];
      if (key !== 'materials') el.dataset.change = rateNow < 0 ? 'loss' : rateNow > 0 ? 'gain' : 'steady';
      else if (state[key] !== Number(el.dataset.previous)) el.dataset.change = state[key] < Number(el.dataset.previous) ? 'loss' : 'gain';
      el.dataset.previous = String(state[key]);
      el.querySelector('strong')!.textContent = `${state[key].toFixed(1)}${key === 'battery' ? ` / ${flow.capacity}` : ''}`; const rate = key === 'materials' ? undefined : flow[key]; el.querySelector('small')!.textContent = rate === undefined ? 'Construction supply' : `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}/day${rate < 0 ? ` · ${(state[key] / -rate).toFixed(1)} days remaining` : ''}`; }
    const type = q<HTMLSelectElement>('#sim-type').value as FacilityType; const spec = constructionTypes[type];
    q('#sim-build-info').textContent = `${spec.description} ${daysRemaining(spec.seconds)} construction · 2 crew · ${spec.cost} materials.`;
    plotButtons.forEach((b, i) => { const f = state.facilities.find(f => f.plot === i); b.disabled = !f && (state.materials < spec.cost || state.outcome !== 'active'); b.textContent = f ? `Plot ${i+1} · ${constructionTypes[f.type].name} · ${f.progress >= constructionTypes[f.type].seconds ? (f.enabled === false ? 'Offline' : 'Online') : `${Math.floor(f.progress / constructionTypes[f.type].seconds * 100)}%`}` : `+ Plot ${i+1}`; });
    if (selected !== undefined) {
      const facility = typeof selected === 'number' ? state.facilities.find(f => f.plot === selected) : undefined;
      const building = buildings.find(b => b.id === selected);
      q('#sim-facility-title').textContent = facility ? `${constructionTypes[facility.type].name} · Plot ${facility.plot + 1}` : building?.name ?? 'Facility';
      q('#sim-facility-detail').textContent = facility ? constructionTypes[facility.type].description : selected === 'farm' ? 'Manage crop lighting and water recovery across the base.' : selected === 'control' ? 'Manage crew protection and life support.' : 'Stay connected to mission control on Earth.';
      q<HTMLInputElement>('#sim-grow-lights').checked = state.growLights !== false;
      q<HTMLInputElement>('#sim-recycler').checked = state.recycler !== false;
      q<HTMLInputElement>('#sim-reserve-air').checked = state.reserveAir === true;
      q<HTMLButtonElement>('#sim-panel-shelter').textContent = state.sheltered ? 'Release crew to stations' : 'Recall crew to shelter';
      q('#sim-facility-panel').querySelectorAll<HTMLInputElement>('input').forEach(input => input.disabled = state.outcome !== 'active');
      q<HTMLButtonElement>('#sim-panel-shelter').disabled = state.outcome !== 'active';
      if (facility) {
        const complete = facility.progress >= constructionTypes[facility.type].seconds;
        q<HTMLInputElement>('#sim-facility-enabled').checked = facility.enabled !== false;
        q<HTMLInputElement>('#sim-facility-enabled').disabled = !complete || state.outcome !== 'active';
        q('#sim-expansion-info').textContent = complete ? facility.type === 'battery' ? 'Disconnecting this bank removes 20 capacity. Energy above the remaining capacity is discarded.' : 'Switch this facility off to suspend its production and resource consumption.' : `Under construction · ${daysRemaining(constructionTypes[facility.type].seconds - facility.progress)} of work remaining.`;
      }
    }
    campaign.render(selected);
    updateSpeed();
    updateScene(state, campaign.driving);
  }
  let vehicleAccumulator = 0;
  let vehicleReadoutAt = 0;
  function frame(now: number) {
    requestAnimationFrame(frame);
    const delta = Math.min((now - last) / 1000, 1); last = now;
    if (!paused && !document.hidden && state.outcome === 'active' && !state.campaign.flight) {
      const driving = campaign.driving;
      accumulator += delta * (driving ? 1 : speed);
      if (driving) {
        vehicleAccumulator += Math.min(delta, .25);
        const input = campaign.driveInput();
        while (vehicleAccumulator >= driveStep) {
          stepRover(state.campaign.rover, input, driveStep);
          vehicleAccumulator -= driveStep;
        }
      } else vehicleAccumulator = 0;
      if (accumulator < 1) {
        if (driving && now - vehicleReadoutAt >= 125) {
          vehicleReadoutAt = now;
          campaign.render(selected);
          updateScene(state, true);
        }
        return;
      }
      while (accumulator >= 1) {
        accumulator--;
        if (stepOutpost(state)) {
          paused = true; campaign.clearInput(); pauseAudio(true);
          accumulator = vehicleAccumulator = 0;
          state.campaign.rover.velocity = state.campaign.rover.steering = 0;
          save(); break;
        }
        if (state.elapsed % 5 === 0) save();
      }
      render();
    }
  }
  setPaused(true);
  if (isLandedOutpostKey(saveKey)) {
    try { localStorage.setItem(lastLandedOutpostKey, saveKey); } catch { /* Direct resume can still find the flight's save. */ }
  }
  requestAnimationFrame(frame);
  return { openBuilding(building: Building) { openFacility(building.id); }, openExpansion(plot: number) { if (state.facilities.some(f => f.plot === plot)) openFacility(plot); } };
}
