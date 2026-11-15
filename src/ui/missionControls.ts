import { resourceChange } from './resourceChange';
import { mountTimeline, harvestForecast, forecastAdvice } from './missionTimeline';
import { mountFacilityJobs } from './facilityJobs';
import { missionBeat } from './missionStory';
import { crew, crewTasks, resting } from '../data/crew';
import { buildings, type Building } from '../data/buildings';
import {
  commitDay, defaultPlan, forecastPower, hasParticleRisk, lightSettings, lunarTraining, previewDay, startMission, stormPhase,
  type DailyPlan, type DayResult, type Hazard, type Scenario,
} from '../mission/dailyMission';
import { createSave, parseSave, saveKey, type MissionSave } from '../mission/persistence';
import type { PresentMissionEvent } from '../mission/presentation';
import type { mountBuildingControls } from './buildingControls';
import { mountCrewControls } from './crewControls';
import { mountStormBriefing } from './stormBriefing';
import { mountMissionRadio } from './missionRadio';
import { mountControlCentre } from './controlCentre';
import type { MotionPreference } from './motionPreference';

const lightSteps = ['off', 'low', 'full'] as const;
const rules = lunarTraining;
const forecast = {
  clear: 'Particle readings are quiet.',
  warning: `Particle alert. Plan to use the shelter on days ${rules.stormStart} and ${rules.stormStart + 1}.`,
  rising: 'Particle levels are rising. Move the crew into the shelter.',
  peak: 'Particle levels are highest today. Keep the crew in the shelter.',
  recovery: 'Particle levels have eased. The crew can return to the habitat.',
};
const hazardMessage: Record<Hazard, string> = {
  exposure: 'The crew was exposed to dangerous particles outside the shelter.',
  air: 'The reserve tank could not supply enough air.',
  power: 'The battery could not run essential systems before the panels began charging.',
  food: 'There was too little food for the crew at the start of the day.',
  water: 'There was too little drinking water at the start of the day.',
};

function metric(label: string, value: string, detail: string, tone = '') {
  const card = document.createElement('article');
  card.className = 'metric';
  card.dataset.tone = tone;
  for (const [tag, text] of [['span', label], ['strong', value], ['small', detail]]) {
    const line = document.createElement(tag);
    line.textContent = text;
    card.append(line);
  }
  return card;
}

function byId<T extends HTMLElement = HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}

export function mountMission(
  navigation: ReturnType<typeof mountBuildingControls>,
  selectScene: (id?: Building['id']) => void,
  present: PresentMissionEvent,
  motion: MotionPreference,
) {
  const form = byId<HTMLFormElement>('day-form');
  const updateTray = new ResizeObserver(() => {
    const timelineBottom = document.querySelector('.mission-timeline')!.getBoundingClientRect().bottom;
    document.documentElement.style.setProperty('--panel-ceiling', `${Math.ceil(timelineBottom + 8)}px`);
    const trayHeight = form.querySelector('.workbench')!.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--planning-tray-height', `${Math.ceil(trayHeight + parseFloat(getComputedStyle(byId('mission-workspace')).paddingBottom) + 6)}px`);
  });
  updateTray.observe(form.querySelector('.workbench')!);
  updateTray.observe(document.querySelector('.mission-timeline')!);
  const lights = byId<HTMLInputElement>('lights');
  const recovery = byId<HTMLInputElement>('water-recovery');
  const submit = byId<HTMLButtonElement>('end-day');
  const report = byId('day-report');
  const proceed = byId<HTMLButtonElement>('continue-day');
  const resolution = byId('resolution');
  const debrief = byId('debrief');
  const panels = { farm: byId('farm-panel'), control: byId('control-panel'), comms: byId('comms-panel') };
  const radio = mountMissionRadio(received => {
    navigation.status('comms', received ? 'Reply ready' : 'Earth link');
    if (received) present({ type: 'forecast' });
  });
  const storyButton = byId<HTMLButtonElement>('story-action');
  const drawTimeline = mountTimeline(() => storyButton.click(), reportItems);
  const drawJobs = mountFacilityJobs(assignments => {
    crewControls.set(assignments);
    renderPreview();
  });
  const saveStatus = byId('save-status');
  const crewButton = document.createElement('button');
  crewButton.type = 'button';
  crewButton.className = 'facility-tab crew-tab';
  crewButton.textContent = 'Crew';
  crewButton.setAttribute('aria-controls', 'crew-panel');
  crewButton.setAttribute('aria-expanded', 'false');
  byId('facility-tabs').append(crewButton);
  const crewControls = mountCrewControls(() => present({ type: 'forecast' }));
  const stormButton = byId<HTMLButtonElement>('open-storm');
  const controlStormButton = byId<HTMLButtonElement>('control-storm-briefing');
  mountControlCentre();
  const storm = mountStormBriefing(motion, () => present({ type: 'forecast' }), plan => {
    if (plan) {
      setDraft(plan);
      renderPreview();
    }
    openBuilding(buildings[1]);
  });

  let stored: string | null = null;
  try { stored = localStorage.getItem(saveKey); }
  catch { saveStatus.textContent = 'This browser has blocked saving. Keep this tab open to finish the mission.'; }
  const restored = stored ? parseSave(stored) : undefined;

  let save = restored?.save ?? createSave('standard');
  let state = restored?.state ?? startMission('standard');
  let last = restored?.last;
  let selected: Building['id'] | undefined;
  let timer = 0;
  let finish: (() => void) | undefined;
  let live = false;
  let stale = false;
  let history = restored?.history ?? [];
  let panelTrigger: HTMLElement | undefined;

  function writeSave(next: MissionSave, replace = false) {
    try {
      const current = localStorage.getItem(saveKey);
      if (!replace && current !== stored) {
        stale = true;
        saveStatus.textContent = 'This mission changed in another tab. Reload to continue from the saved turn.';
        return false;
      }
      const value = JSON.stringify(next);
      localStorage.setItem(saveKey, value);
      stored = value;
      saveStatus.textContent = '';
    } catch {
      saveStatus.textContent = 'Progress could not be saved. Keep this tab open to finish the mission.';
    }
    save = next;
    return true;
  }

  function openBuilding(building: Building, focus = true) {
    if (!live || !save.reviewed || state.outcome !== 'active') return;
    closeCrew();
    const focused = document.activeElement;
    panelTrigger = focused instanceof HTMLElement && (focused === storyButton || focused === navigation.markers[building.id])
      ? focused : navigation.tabs[building.id];
    selected = building.id;
    for (const [key, panel] of Object.entries(panels)) panel.hidden = key !== selected;
    const panel = panels[selected];
    panel.style.setProperty('--facility-color', `#${building.color.toString(16)}`);
    panel.scrollTop = 0;
    positionPanel();
    navigation.select(selected);
    selectScene(selected);
    if (focus) panel.querySelector('h2')?.focus({ preventScroll: true });
  }

  function positionPanel() {
    if (!selected) return;
    const panel = panels[selected];
    const marker = navigation.markers[selected].getBoundingClientRect();
    const width = Math.min(450, innerWidth - 42);
    const rightOfMarker = marker.right + 14;
    const leftOfMarker = marker.left - width - 14;
    const left = rightOfMarker + width < innerWidth - 20 ? rightOfMarker
      : leftOfMarker >= 20 ? leftOfMarker : innerWidth - width - 20;
    panel.style.setProperty('--panel-x', `${Math.round(left)}px`);
    panel.style.setProperty('--panel-right', 'auto');
  }
  window.addEventListener('resize', positionPanel);

  function closeFacility(restoreFocus = false) {
    selected = undefined;
    for (const panel of Object.values(panels)) panel.hidden = true;
    navigation.select();
    selectScene();
    if (restoreFocus) panelTrigger?.focus({ preventScroll: true });
  }

  function closeCrew(restoreFocus = false) {
    crewControls.panel.hidden = true;
    crewButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) crewButton.focus();
  }

  crewButton.addEventListener('click', () => {
    closeFacility();
    crewControls.panel.hidden = false;
    crewControls.panel.scrollTop = 0;
    crewButton.setAttribute('aria-expanded', 'true');
    byId('crew-heading').focus({ preventScroll: true });
  });
  byId('close-crew').addEventListener('click', () => closeCrew(true));

  function setDraft(plan: DailyPlan) {
    for (const name of ['location', 'airMode'] as const) {
      form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${plan[name]}"]`)!.checked = true;
    }
    lights.value = String(lightSteps.indexOf(plan.lights));
    recovery.checked = plan.recovery;
    crewControls.set(plan.assignments);
  }

  function draft(): DailyPlan {
    return {
      location: form.querySelector<HTMLInputElement>('input[name=location]:checked')?.value === 'shelter' ? 'shelter' : 'habitat',
      airMode: form.querySelector<HTMLInputElement>('input[name=airMode]:checked')?.value === 'reserve' ? 'reserve' : 'normal',
      lights: lightSteps[lights.valueAsNumber],
      recovery: recovery.checked,
      assignments: crewControls.read(),
    };
  }

  function renderState() {
    const limits = { battery: rules.capacity.battery, air: rules.capacity.air, food: rules.startingFood };
    for (const key of ['battery', 'air', 'food'] as const) {
      const limit = limits[key];
      const meter = byId<HTMLMeterElement>(key);
      meter.max = limit;
      meter.value = state[key];
      byId(`${key}-fill`).style.setProperty('--fill', String(Math.min(1, state[key] / limit)));
      const value = byId(`${key}-value`);
      value.textContent = key === 'food' ? `${state.food} units` : `${state[key]} / ${limit}`;
      value.removeAttribute('aria-label');
    }
    byId('resource-alert').textContent = state.water <= 2 ? `Low drinking water · ${state.water} left` : '';
    byId('food-value').title = `${Math.floor(state.food / rules.foodPerDay)} days of food at the current daily rate`;
    const day = state.completedDays + 1;
    radio.render(day, state.outcome);
    stormButton.hidden = !save.reviewed || state.outcome !== 'active' || day < rules.stormStart || day > rules.stormStart + 1;
    controlStormButton.disabled = !save.reviewed || state.outcome !== 'active' || day > rules.stormStart + 1;
    byId('day-title').textContent = !save.reviewed
      ? `Day ${state.completedDays} of ${rules.days} · Report`
      : state.outcome === 'active' ? `Day ${day} of ${rules.days} · Plan` : 'Mission complete';
    byId('story-card').hidden = state.outcome !== 'active' || !save.reviewed;
    drawTimeline(state, history);
  }

  function renderPreview() {
    if (state.outcome !== 'active' || !save.reviewed) return;
    const plan = draft();
    const result = previewDay(state, plan);
    const peak = result.phase === 'peak' ? 1 : 0;
    const showWater = result.day > 1;
    const risk = hasParticleRisk(result.phase);
    const demand = result.essentialPower + result.recoveryPower + result.lightPower;
    const light = lightSettings[plan.lights];
    const warnings = result.hazards.length ? ['This plan will interrupt training.', ...result.hazards.map(hazard => hazardMessage[hazard])] : [];
    if (result.powerGap) warnings.unshift(`Short by ${result.powerGap} power after charging. Lower the lights or switch off water recovery.`);
    if (result.next.outcome === 'active' && result.next.food < rules.foodPerDay) warnings.push('Tomorrow starts short of food. Advance the harvest today while you still have meals.');
    if (result.next.outcome === 'active' && result.next.water < rules.waterPerDay) warnings.push('Tomorrow starts without drinking water. Run the recycler today.');
    if (result.next.outcome === 'shortfall') warnings.push('This plan falls short of the final supply target.');
    if (stale) warnings.unshift('Reload this tab to continue from the saved turn.');

    const solar = result.generation;
    const beforeSun = state.battery - result.essentialPower;
    const harvest = harvestForecast(plan, result);
    const cropProgress = result.harvest ? rules.cropTarget : result.next.crop;
    const safety = byId('tower-safety');
    safety.dataset.tone = result.hazards.includes('exposure') ? 'danger' : result.phase === 'warning' ? 'attention' : 'safe';
    byId('tower-phase').textContent = risk ? (plan.location === 'shelter' ? 'Sheltered' : 'Exposure risk') : 'Safe to work outside';
    byId('forecast-detail').textContent = forecast[result.phase];
    byId('tower-power').replaceChildren(resourceChange('Battery', state.battery, result.next.battery));
    byId('tower-budget').textContent = result.hazards.includes('power') ? 'Essential power shortfall before sunlight' : `+${solar} solar · −${demand} demand`;
    byId('location-habitat').textContent = risk ? '0 fan power · exposure risk' : '0 fan power · outside work';
    byId('location-shelter').textContent = '+1 fan power · outside jobs pause';
    byId('air-normal').textContent = `${2 + peak} power · keeps reserve air`;
    byId('air-reserve').textContent = `${1 + peak} power · uses ${2 + peak} air`;
    byId('air-status').textContent = `Reserve air ${state.air} → ${result.next.air}. CO₂ removal runs with either supply.`;
    byId('power-flow').replaceChildren(...[
      ['1 · Before sunlight', `${state.battery} battery − ${result.essentialPower} essentials`, beforeSun < 0 ? 'Essential systems short of power' : `${beforeSun} battery left`],
      ['2 · Solar charging', `+${solar} generation`, result.lostGeneration ? `${result.lostGeneration} overflow at capacity` : `Capacity ${rules.capacity.battery}`],
      ['3 · Facility demand', `−${result.lightPower} lights · −${result.recoveryPower} recovery`, `${result.next.battery} battery at end of day`],
    ].map(([title, budget, outcome], index) => metric(title, budget, outcome, index === 0 && beforeSun < 0 ? 'danger' : '')));
    byId('water-panel').hidden = !showWater;
    recovery.disabled = !showWater;
    byId('recycler-cost').textContent = result.operations.tunedRecycler ? '· 0 power with Mateo' : '· 1 power';
    byId('water-outlook').textContent = `${state.water} → ${result.next.water} water · −1 drinking · −${Number(result.growth > 0)} crops · +${result.recovered} recovery`;
    byId('farm-metrics').replaceChildren(
      metric('Crop today', `${state.crop} → ${cropProgress} / ${rules.cropTarget}`, result.harvest ? 'Crop mature' : `+${result.growth} growth`),
      metric('Next harvest', harvest ? `Day ${harvest}` : 'Uncertain', harvest ? `+${rules.harvestFood} food · ${result.harvest ? 'today' : 'estimated'}` : 'Try more light or water', harvest ? 'safe' : 'attention'),
    );
    byId<HTMLProgressElement>('crop-stage').value = cropProgress;
    const lowerLight = plan.lights === 'full' ? 'low' : 'off';
    const lower = previewDay(state, { ...plan, lights: lowerLight });
    const difference = result.next.battery - lower.next.battery;
    const comparison = plan.lights === 'off' ? '' : ` · ${Math.abs(difference)} ${difference < 0 ? 'less' : 'more'} battery than ${lightSettings[lowerLight].label}`;
    byId('light-output').textContent = `${light.label} · ${light.power} power · +${result.growth} crop progress${difference ? comparison : ''}`;
    for (const key of ['battery', 'air', 'food'] as const) {
      const value = byId(`${key}-value`);
      value.replaceChildren(resourceChange('', state[key], result.next[key]));
      value.setAttribute('aria-label', `Current ${state[key]}, planned ${result.next[key]}`);
    }
    drawTimeline(state, history, result, harvest);
    drawJobs(state, plan, result);
    navigation.status('farm', result.harvest ? 'Harvest today' : result.growth ? 'Crop growing' : 'Growth paused');
    navigation.status('control', risk ? (plan.location === 'shelter' ? 'Shelter planned' : 'Shelter needed') : 'Systems ready');
    const facilityTasks = { farm: ['grow', 'recycle'], control: ['inspect', 'repair', 'safety'], comms: ['radio'] };
    for (const { id } of buildings) {
      navigation.showCrew(id, crew.filter(member => facilityTasks[id].includes(plan.assignments[member.id]))
        .map(member => member.name.split(' ')[0]));
    }
    const beat = missionBeat(state, result);
    byId<HTMLImageElement>('story-portrait').src = `/media/crew-${beat.speaker.id}.webp`;
    byId('story-speaker').textContent = beat.speaker.name;
    byId('story-title').textContent = beat.title;
    byId('day-briefing').textContent = beat.line;
    storyButton.textContent = beat.action;
    storyButton.onclick = () => {
      if (!live || !save.reviewed || state.outcome !== 'active') return;
      if (beat.building === 'control') document.querySelector<HTMLButtonElement>('[data-tower-view="tower-dashboard"]')?.click();
      openBuilding(buildings.find(building => building.id === beat.building)!);
      if ('storm' in beat) storm.open(state, draft());
      else if (result.day === 4) form.querySelector<HTMLInputElement>('input[name=airMode]:checked')?.focus();
    };
    lights.setAttribute('aria-valuetext', light.label);
    byId('plan-summary').replaceChildren(...(['battery', 'air', 'food', 'water'] as const)
      .map(key => resourceChange(key, state[key], result.next[key])));
    byId('plan-preview').textContent = `+${result.generation} solar power · −${demand} used · −${rules.foodPerDay} food${result.harvest ? ` · +${result.harvest} harvest` : ''}`;
    const working = crew.filter(({ id }) => plan.assignments[id] !== 'rest').length;
    byId('plan-crew').textContent = `${working} crew working · ${crew.length - working} resting · assignments reset each day`;
    const crewErrors = crew.filter(({ id }) => result.operations.errors[id]);
    if (crewErrors.length) warnings.push(`Change ${crewErrors.map(({ name }) => name.split(' ')[0]).join(', ')}’s assignment in Crew.`);
    crewControls.render(state, plan, result);
    const warning = byId('plan-warning');
    warning.textContent = warnings.join(' ');
    warning.hidden = !warnings.length;
    submit.disabled = !live || stale || Boolean(result.powerGap) || crewErrors.length > 0;
    submit.dataset.turn = `${save.runId}/${result.day}`;
  }

  function reportSummary(result: DayResult) {
    if (result.hazards.length) return result.hazards.map(hazard => hazardMessage[hazard]).join(' ');
    if (result.harvest) return `Harvest ready · +${result.harvest} food.${hasParticleRisk(result.phase) ? ' The crew stayed protected.' : ''}`;
    if (hasParticleRisk(result.phase)) return 'The crew stayed protected through the particle alert.';
    if (result.next.controller === 'repaired' && Object.values(result.next.lastPlan.assignments).includes('repair')) {
      const worker = crew.find(({ id }) => result.next.lastPlan.assignments[id] === 'repair')!;
      return `${worker.name} repaired the controller · +1 solar power on future days.`;
    }
    if (result.operations.extraGrowth && result.growth) {
      const grower = crew.find(({ id }) => result.next.lastPlan.assignments[id] === 'grow')!;
      return `${grower.name} boosted crop growth by ${result.operations.extraGrowth}.`;
    }
    return result.growth ? `Crops gained ${result.growth} progress.` : 'Crop growth paused.';
  }

  function reportItems(result: DayResult) {
    const state = result.next;
    const items = [
      `Solar panels generated ${result.generation}. Systems needed ${result.essentialPower + result.recoveryPower + result.lightPower}. Battery now ${state.battery}.`,
      `${result.eaten} food used for today’s meals · ${state.food} left.`,
      result.airUsed ? `Spent ${result.airUsed} reserve air · ${state.air} left.` : `Reserve air unchanged · ${state.air} left.`,
      `Crop progress ${state.crop} of ${rules.cropTarget}. ${result.harvest ? 'Next crop started.' : 'The next harvest will add food after it matures.'}`,
    ];
    if (result.lostGeneration) items.push(`The battery was full during charging. ${result.lostGeneration} solar power could not be stored.`);
    if (crew.some(({ id }) => ['inspect', 'repair'].includes(result.next.lastPlan.assignments[id]))) {
      const controllerReport = {
        uninspected: '',
        diagnosed: 'The crew identified the solar controller fault. Assign a repair on a clear day.',
        'partly-repaired': 'One repair shift is complete. A backup needs one more shift.',
        repaired: 'The solar controller is repaired. Expect one more solar power each day from now on.',
      };
      if (controllerReport[result.next.controller]) items.push(controllerReport[result.next.controller]);
    }
    for (const member of crew) {
      const task = result.next.lastPlan.assignments[member.id];
      if (task !== 'rest') items.push(`${member.name} · ${crewTasks[task].name} · ${state.readiness[member.id]} readiness left.`);
    }
    if (result.operations.tunedRecycler) items.push('Mateo’s tuning saved one recycler power today.');
    if (result.operations.recoveryBonus) items.push('The recycler could reclaim one extra water if wastewater was available.');
    if (hasParticleRisk(result.phase) && !result.hazards.length) {
      items.push('Sheltering postponed outdoor assignments. Plan outside work once particle levels ease.');
    }
    items.push(...forecastAdvice(state, state.lastPlan, result.operations.forecastDays));
    if (result.day > 1) items.push(`Recovered ${result.recovered} water · ${state.water} drinking water left.`);
    return [reportSummary(result), ...items];
  }

  function renderReport(result: DayResult) {
    byId('report-title').textContent = `Day ${result.day} report`;
    const [summary, ...items] = reportItems(result);
    byId('report-line').textContent = summary;
    const before = history[result.day - 2]?.next ?? startMission(result.next.scenario);
    byId('report-resources').replaceChildren(...(['battery', 'air', 'food', 'water'] as const)
      .map(key => resourceChange(key, before[key], result.next[key])));
    byId('report-next').textContent = state.outcome === 'active'
      ? missionBeat(state, previewDay(state, { ...state.lastPlan, assignments: resting })).title
      : '';
    byId('report-items').replaceChildren(...items.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    byId<HTMLDetailsElement>('report-details').open = result.hazards.length > 0 || Object.values(result.next.lastPlan.assignments).some(task => task !== 'rest');
    proceed.textContent = state.outcome === 'active' ? `Plan day ${result.day + 1}` : 'View debrief';
    proceed.disabled = stale;
    report.hidden = false;
    byId('report-title').focus();
  }

  function renderDebrief() {
    const contributions = new Set(history.flatMap(result => crew.filter(({ id }) => result.next.lastPlan.assignments[id] !== 'rest').map(({ id }) => id)));
    byId('crew-achievement').textContent = contributions.size === crew.length && state.outcome === 'ready'
      ? 'Crew coordination earned · all five astronauts contributed.'
      : `Crew coordination · ${contributions.size} of ${crew.length} astronauts completed a job.`;
    byId('outcome').textContent = state.outcome === 'ready' ? 'Crew safe and outpost ready'
      : state.outcome === 'shortfall' ? 'Crew safe, supplies below target' : 'Training interrupted';
    byId('outcome-detail').textContent = state.outcome === 'interrupted' ? last!.hazards.map(hazard => hazardMessage[hazard]).join(' ')
      : `The crew finished all ${rules.days} days and brought in ${state.harvests} ${state.harvests === 1 ? 'harvest' : 'harvests'}. The readiness target was ${rules.readiness.battery} battery and ${rules.readiness.food} food.`;
    byId('outcome-resources').textContent = `${state.battery} battery · ${state.air} reserve air · ${state.food} food · ${state.water} water`;
    byId<HTMLSelectElement>('scenario').value = state.scenario;
    debrief.hidden = false;
    byId('outcome').focus();
    present({ type: 'debrief', state, phase: last?.phase ?? 'clear' });
  }

  function showCurrent() {
    renderState();
    report.hidden = true;
    debrief.hidden = true;
    const planning = state.outcome === 'active' && save.reviewed;
    form.hidden = !planning;
    navigation.enable(planning);
    if (!save.reviewed && last) renderReport(last);
    else if (!planning) renderDebrief();
    else {
      renderPreview();
      closeFacility();
      storyButton.focus({ preventScroll: true });
    }
  }

  function newRun(scenario: Scenario) {
    stale = false;
    writeSave(createSave(scenario), true);
    state = startMission(scenario);
    last = undefined;
    radio.reset();
    setDraft(defaultPlan);
    present({ type: 'reset', state, phase: 'clear' });
    history = [];
    showCurrent();
  }

  for (const tip of document.querySelectorAll<HTMLElement>('.info-tip')) {
    const button = tip.querySelector('button')!;
    const text = tip.querySelector<HTMLElement>('.tip-body')!;
    let pinned = false;
    const show = (visible: boolean) => {
      text.hidden = !visible;
      button.setAttribute('aria-expanded', String(visible));
    };
    tip.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(true); });
    tip.addEventListener('pointerleave', () => { if (!pinned && !button.matches(':focus-visible')) show(false); });
    button.addEventListener('focus', () => { if (button.matches(':focus-visible')) show(true); });
    button.addEventListener('blur', () => { pinned = false; show(false); });
    button.addEventListener('click', () => { pinned = !pinned; show(pinned); });
    button.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !text.hidden) {
        event.stopPropagation();
        pinned = false;
        show(false);
      }
    });
  }
  byId('mission-objective').textContent = `Keep all ${rules.crewSize} astronauts safe for ${rules.days} days. Finish with at least ${rules.readiness.battery} battery and ${rules.readiness.food} food.`;
  document.querySelectorAll('[data-close-facility]').forEach(button => button.addEventListener('click', () => closeFacility(true)));
  const views = [...document.querySelectorAll<HTMLButtonElement>('[data-tower-view]')];
  for (const button of views) button.addEventListener('click', () => {
    for (const view of views) {
      view.setAttribute('aria-pressed', String(view === button));
      byId(view.dataset.towerView!).hidden = view !== button;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.target instanceof HTMLSelectElement || byId<HTMLDialogElement>('storm-briefing').open) return;
    if (selected) closeFacility(true);
    else if (!crewControls.panel.hidden) closeCrew(true);
  });
  stormButton.addEventListener('click', () => storm.open(state, draft()));
  controlStormButton.addEventListener('click', () => storm.open(state, draft(), true));
  byId('skip-resolution').addEventListener('click', () => finish?.());
  motion.changes.addEventListener('change', () => { if (motion.reduced) finish?.(); });
  form.addEventListener('input', renderPreview);
  form.addEventListener('change', renderPreview);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!live || stale || finish || !save.reviewed) return;
    const day = state.completedDays + 1;
    if (submit.dataset.turn !== `${save.runId}/${day}`) return;
    const plan = draft();
    const result = commitDay(state, plan, day);
    if (!result) return;
    const previous = state;
    if (!writeSave({ ...save, plans: [...save.plans, plan], reviewed: false })) {
      renderPreview();
      return;
    }

    last = result;
    history.push(result);
    state = result.next;
    radio.reset();
    closeFacility();
    closeCrew();
    stormButton.hidden = true;
    form.hidden = true;
    navigation.enable(false);
    byId('day-title').textContent = `Day ${day} of ${rules.days} · Resolving`;
    byId('story-card').hidden = true;
    byId('resolution-phase').textContent = hasParticleRisk(result.phase) ? 'Simulated particle monitor' : 'Outpost systems';
    byId('resolution-title').textContent = `Running day ${day}`;
    byId('risk-trace').toggleAttribute('hidden', !hasParticleRisk(result.phase));
    byId('risk-trace').dataset.phase = result.phase;
    byId('resolution-readout').textContent = `Solar generation ${result.generation} · Crew in the ${plan.location}`;
    const work = crew.filter(({ id }) => plan.assignments[id] !== 'rest')
      .map(({ name, id }) => `${name.split(' ')[0]} · ${crewTasks[plan.assignments[id]].name}`);
    byId('resolution-caption').textContent = work.length ? work.join(' / ')
      : result.harvest ? 'The greenhouse adds the ripe crop to food stores.' : 'Systems are applying your choices.';
    const duration = motion.reduced ? 0 : 2600;
    present({ type: 'day', previous, result, duration });
    const complete = () => {
      clearTimeout(timer);
      finish = undefined;
      resolution.hidden = true;
      present({ type: 'settled', state, phase: result.phase });
      showCurrent();
    };
    if (duration) {
      finish = complete;
      resolution.hidden = false;
      byId('resolution-title').focus();
      timer = window.setTimeout(complete, duration);
    } else complete();
  });

  function preparePlanning() {
    const next = { ...state.lastPlan, assignments: { ...resting } };
    if (!hasParticleRisk(stormPhase(state.completedDays + 1))) next.location = 'habitat';
    setDraft(next);
    if (stormPhase(state.completedDays + 1) === 'warning') present({ type: 'warning' });
  }

  proceed.addEventListener('click', () => {
    if (save.reviewed || finish || stale) return;
    if (!writeSave({ ...save, reviewed: true })) {
      proceed.disabled = true;
      return;
    }
    if (state.outcome === 'active') preparePlanning();
    showCurrent();

  });

  byId('retry').addEventListener('click', () => {
    const scenario = byId<HTMLSelectElement>('scenario').value;
    newRun(scenario === 'lowPower' ? 'lowPower' : 'standard');
  });
  window.addEventListener('storage', event => {
    if (event.key !== saveKey && event.key !== null) return;
    if (event.newValue === stored) return;
    stale = true;
    saveStatus.textContent = 'This mission changed in another tab. Reload to continue from the saved turn.';
    proceed.disabled = true;
    renderPreview();
  });

  return {
    openBuilding,
    recoveryNotice: stored && !restored ? 'The previous save could not be read. Start a fresh mission.' : '',
    canResume: Boolean(restored),
    enter(resume: boolean) {
      live = true;
      if (resume && restored) {
        setDraft(state.lastPlan);
        present({ type: 'settled', state, phase: restored.last?.phase ?? 'clear' });
        if (save.reviewed && state.outcome === 'active') preparePlanning();
        showCurrent();
      } else newRun('standard');
    },
  };
}
