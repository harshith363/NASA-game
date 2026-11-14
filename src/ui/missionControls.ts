import { buildings, type Building } from '../data/buildings';
import {
  commitDay, defaultPlan, hasParticleRisk, lightSettings, lunarTraining, previewDay, startMission, stormPhase,
  type DailyPlan, type DayResult, type Hazard, type Scenario,
} from '../mission/dailyMission';
import { createSave, parseSave, saveKey, type MissionSave } from '../mission/persistence';
import type { PresentMissionEvent } from '../mission/presentation';
import type { mountBuildingControls } from './buildingControls';
import { mountMissionRadio } from './missionRadio';
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
  const location = byId<HTMLSelectElement>('location');
  const airMode = byId<HTMLSelectElement>('air-mode');
  const lights = byId<HTMLInputElement>('lights');
  const recovery = byId<HTMLInputElement>('water-recovery');
  const submit = byId<HTMLButtonElement>('end-day');
  const report = byId('day-report');
  const proceed = byId<HTMLButtonElement>('continue-day');
  const facility = byId('facility');
  const heading = byId('building-name');
  const resolution = byId('resolution');
  const debrief = byId('debrief');
  const panels = { farm: byId('farm-panel'), control: byId('control-panel'), comms: byId('comms-panel') };
  const radio = mountMissionRadio(() => present({ type: 'forecast' }));
  const saveStatus = byId('save-status');

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
    selected = building.id;
    for (const [key, panel] of Object.entries(panels)) panel.hidden = key !== selected;
    heading.textContent = building.name;
    byId('building-description').textContent = building.description;
    facility.style.setProperty('--facility-color', `#${building.color.toString(16)}`);
    facility.hidden = false;
    facility.scrollTop = 0;
    navigation.select(selected);
    selectScene(selected);
    if (focus) heading.focus({ preventScroll: true });
  }

  function closeFacility(restoreFocus = false) {
    const previous = selected;
    selected = undefined;
    facility.hidden = true;
    navigation.select();
    selectScene();
    if (previous && restoreFocus) navigation.tabs[previous].focus();
  }

  function setDraft(plan: DailyPlan) {
    location.value = plan.location;
    airMode.value = plan.airMode;
    lights.value = String(lightSteps.indexOf(plan.lights));
    recovery.checked = plan.recovery;
  }

  function draft(): DailyPlan {
    return {
      location: location.value === 'shelter' ? 'shelter' : 'habitat',
      airMode: airMode.value === 'reserve' ? 'reserve' : 'normal',
      lights: lightSteps[lights.valueAsNumber],
      recovery: recovery.checked,
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
      byId(`${key}-value`).textContent = key === 'food' ? `${state.food} units` : `${state[key]} / ${limit}`;
    }
    byId('resource-alert').textContent = state.water <= 2 ? `Low drinking water · ${state.water} left` : '';
    byId('food-value').title = `${Math.floor(state.food / rules.foodPerDay)} days of food at the current daily rate`;
    const day = state.completedDays + 1;
    radio.render(day, state.outcome);
    byId('day-title').textContent = !save.reviewed
      ? `Day ${state.completedDays} of ${rules.days} · Report`
      : state.outcome === 'active' ? `Day ${day} of ${rules.days} · Plan` : 'Mission complete';
    byId('day-briefing').textContent = state.outcome === 'active' && save.reviewed
      ? `Day ${day} forecast · ${rules.generation[day - 1]} solar power. ${forecast[stormPhase(day)]}` : '';
  }

  function renderPreview() {
    if (state.outcome !== 'active' || !save.reviewed) return;
    const plan = draft();
    const result = previewDay(state, plan);
    const peak = result.phase === 'peak' ? 1 : 0;
    const showWater = result.day > 1;
    const condition = hasParticleRisk(result.phase) ? 'Shelter required' : 'Habitat open';
    const demand = result.essentialPower + result.recoveryPower + result.lightPower;
    const light = lightSettings[plan.lights];
    const warnings = result.hazards.length ? ['This plan will interrupt training.', ...result.hazards.map(hazard => hazardMessage[hazard])] : [];
    if (result.powerGap) warnings.unshift(`Short by ${result.powerGap} power after charging. Lower the lights or switch off water recovery.`);
    if (result.next.outcome === 'active' && result.next.food < rules.foodPerDay) warnings.push('Tomorrow starts short of food. Advance the harvest today while you still have meals.');
    if (result.next.outcome === 'active' && result.next.water < rules.waterPerDay) warnings.push('Tomorrow starts without drinking water. Run the recycler today.');
    if (result.next.outcome === 'shortfall') warnings.push('This plan falls short of the final supply target.');
    if (stale) warnings.unshift('Reload this tab to continue from the saved turn.');

    byId('tower-phase').textContent = condition;
    byId('tower-crew').textContent = `Crew of ${rules.crewSize} · Chosen location ${plan.location} · Reserve air ${state.air}`;
    byId('tower-power').textContent = `Generation +${result.generation} · Demand −${demand} · Battery ${state.battery} → ${result.next.battery}`;
    byId('forecast-detail').textContent = forecast[result.phase];
    byId('tower-note').textContent = `Essential systems draw battery power before solar charging. The battery holds up to ${rules.capacity.battery} power.`;
    byId('phase-demand').textContent = 'CO₂ removal runs in both modes. Reserve mode uses stored air and saves one power.';
    airMode.options[0].textContent = `Normal supply (${2 + peak} power)`;
    airMode.options[1].textContent = `Use reserve (${1 + peak} power, ${2 + peak} air)`;
    byId('tower-water').hidden = !showWater;
    byId('tower-water').textContent = `Drinking water ${state.water} → ${result.next.water}. Change recovery in the Farm.`;
    byId('water-panel').hidden = !showWater;
    recovery.disabled = !showWater;
    byId('water-outlook').textContent = `${state.water} → ${result.next.water} water. Crew uses 1 daily. Growing crops use 1 more. This plan recovers ${result.recovered}.`;
    const growth = result.growth ? ` adds ${result.growth} progress` : ' makes no progress';
    const earliest = Math.ceil((rules.cropTarget - state.crop) / lightSettings.full.growth);
    byId('crop-outlook').textContent = result.harvest
      ? `${state.crop} of ${rules.cropTarget} now. Your crop matures today and adds ${result.harvest} food for future days.`
      : `${state.crop} of ${rules.cropTarget} now. This plan${growth}. A mature crop adds ${rules.harvestFood} food. Earliest harvest in ${earliest} ${earliest === 1 ? 'day' : 'days'} at Full with water.`;
    byId('light-output').textContent = `${light.label} · ${light.power} power · +${result.growth} crop progress`;
    lights.setAttribute('aria-valuetext', light.label);
    byId('plan-summary').textContent = `Tomorrow’s reserves · ${result.next.battery} battery · ${result.next.air} air · ${result.next.food} food`;
    byId('plan-preview').textContent = `+${result.generation} solar power · −${demand} used · −${rules.foodPerDay} food${result.harvest ? ` · +${result.harvest} harvest` : ''}`;
    const warning = byId('plan-warning');
    warning.textContent = warnings.join(' ');
    warning.hidden = !warnings.length;
    submit.disabled = !live || stale || Boolean(result.powerGap);
    submit.dataset.turn = `${save.runId}/${result.day}`;
  }

  function renderReport(result: DayResult) {
    byId('report-title').textContent = `Day ${result.day} report`;
    byId('report-line').textContent = result.hazards.length ? result.hazards.map(hazard => hazardMessage[hazard]).join(' ')
      : result.harvest ? `Harvest ready. The crew added ${result.harvest} food for future days.`
        : hasParticleRisk(result.phase) ? 'The crew stayed protected through today’s particle alert.'
          : result.growth ? `The crew stayed safe. Crops gained ${result.growth} progress.` : 'The crew stayed safe. Crop progress paused.';
    const items = [
      `Solar panels generated ${result.generation}. Systems needed ${result.essentialPower + result.recoveryPower + result.lightPower}. Battery now ${state.battery}.`,
      `${result.eaten} food used for today’s meals · ${state.food} left.`,
      result.airUsed ? `Spent ${result.airUsed} reserve air · ${state.air} left.` : `Reserve air unchanged · ${state.air} left.`,
      `Crop progress ${state.crop} of ${rules.cropTarget}. ${result.harvest ? 'Next crop started.' : 'The next harvest will add food after it matures.'}`,
    ];
    if (result.lostGeneration) items.push(`The battery was full during charging. ${result.lostGeneration} solar power could not be stored.`);
    if (result.day > 1) items.push(`Recovered ${result.recovered} water · ${state.water} drinking water left.`);
    byId('report-items').replaceChildren(...items.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    byId<HTMLDetailsElement>('report-details').open = result.hazards.length > 0;
    proceed.textContent = state.outcome === 'active' ? `Plan day ${result.day + 1}` : 'View debrief';
    proceed.disabled = stale;
    report.hidden = false;
    byId('report-title').focus();
  }

  function renderDebrief() {
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
      if (state.completedDays === 0 && matchMedia('(max-width: 760px)').matches) {
        closeFacility();
        navigation.tabs.control.focus({ preventScroll: true });
      } else openBuilding(state.completedDays === 1 ? buildings[0] : buildings[1]);
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
    showCurrent();
  }

  byId('mission-objective').textContent = `Keep all ${rules.crewSize} astronauts safe for ${rules.days} days. Finish with at least ${rules.readiness.battery} battery and ${rules.readiness.food} food.`;
  byId('close-facility').addEventListener('click', () => closeFacility(true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected && !(event.target instanceof HTMLSelectElement)) closeFacility(true);
  });
  byId('ask-help').addEventListener('click', () => {
    byId('help-text').textContent = state.completedDays < 2
      ? 'Try Low lights to grow crops while building up a battery buffer.'
      : 'On alert days, choose the shelter first. Use Normal air at the peak to save your reserve.';
  });
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
    state = result.next;
    radio.reset();
    closeFacility();
    form.hidden = true;
    navigation.enable(false);
    byId('day-title').textContent = `Day ${day} of ${rules.days} · Resolving`;
    byId('day-briefing').textContent = '';
    byId('resolution-phase').textContent = hasParticleRisk(result.phase) ? 'Simulated particle monitor' : 'Outpost systems';
    byId('resolution-title').textContent = `Running day ${day}`;
    byId('risk-trace').toggleAttribute('hidden', !hasParticleRisk(result.phase));
    byId('risk-trace').dataset.phase = result.phase;
    byId('resolution-readout').textContent = `Solar generation ${result.generation} · Crew in the ${plan.location}`;
    byId('resolution-caption').textContent = result.harvest ? 'The greenhouse adds the ripe crop to food stores.' : 'Systems are applying your choices.';
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
    const next = { ...state.lastPlan };
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
    byId('help-text').textContent = '';
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
