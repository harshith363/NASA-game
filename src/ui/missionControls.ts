import { buildings, type Building } from '../data/buildings';
import {
  airSettings, commitShift, defaultPlan, harvestTarget, phaseLabel, projectShift, recover,
  resourceLimits, scenarios, shiftCount, shiftDemand, startMission,
  type MissionState, type PresentMissionEvent, type Scenario, type ShiftPlan, type ShiftProjection,
} from '../mission/solarStorm';
import type { mountBuildingControls } from './buildingControls';
import { mountMissionRadio } from './missionRadio';

function byId<T extends HTMLElement = HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}

export function mountMission(
  navigation: ReturnType<typeof mountBuildingControls>,
  selectScene: (id?: Building['id']) => void,
  present: PresentMissionEvent,
) {
  const form = byId<HTMLFormElement>('shift-form');
  const location = byId<HTMLSelectElement>('location');
  const airMode = byId<HTMLSelectElement>('air-mode');
  const lights = byId<HTMLSelectElement>('lights');
  const submit = byId<HTMLButtonElement>('commit-shift');
  const report = byId('shift-report');
  const facility = byId('facility');
  const heading = byId('building-name');
  const resolution = byId('resolution');
  const debrief = byId('debrief');
  const scenario = byId<HTMLSelectElement>('scenario');
  const panels = { farm: byId('farm-panel'), control: byId('control-panel'), comms: byId('comms-panel') };
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const radio = mountMissionRadio(() => present({ type: 'forecast' }));

  let state = startMission();
  let selected: Building['id'] | undefined;
  let helpCount = 0;
  let timer = 0;
  let captionTimer = 0;
  let finish: (() => void) | undefined;
  let live = false;

  function openBuilding(building: Building, focus = true) {
    if (!live || finish || state.outcome !== 'active') return;
    selected = building.id;
    for (const key of Object.keys(panels) as Building['id'][]) panels[key].hidden = key !== selected;
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
    const wasSelected = selected;
    selected = undefined;
    facility.hidden = true;
    navigation.select();
    selectScene();
    if (wasSelected && restoreFocus) navigation.tabs[wasSelected].focus();
  }

  byId('close-facility').addEventListener('click', () => closeFacility(true));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && selected && !(event.target instanceof HTMLSelectElement)) closeFacility(true);
  });

  function draft(): ShiftPlan {
    return {
      location: location.value as ShiftPlan['location'],
      airMode: airMode.value as ShiftPlan['airMode'],
      lights: lights.value as ShiftPlan['lights'],
    };
  }

  function renderPreview() {
    const plan = draft();
    const result = projectShift(state, plan);
    const { addedPower, addedAir } = shiftDemand(state);
    for (const mode of ['normal', 'reserve'] as const) {
      const costs = airSettings[mode];
      const air = costs.reserveUsed ? `, uses ${costs.reserveUsed + addedAir} air` : '';
      airMode.options[mode === 'normal' ? 0 : 1].textContent =
        `${mode === 'normal' ? 'Normal' : 'Use reserve'} (${costs.power + addedPower} power${air})`;
    }
    const peak = shiftDemand(state, 1);
    byId('phase-demand').textContent = addedPower
      ? `Peak demand: the air system needs +${addedPower} power. Reserve mode also uses +${addedAir} air.`
      : `Normal air saves the reserve. At peak, air uses ${peak.addedPower} extra power.`;
    byId('plan-summary').textContent = `Draft · ${result.protectedCrew ? 'Shelter' : 'Standard room'} · ${plan.airMode} air · lights ${plan.lights}`;
    byId('plan-preview').textContent = result.affordable
      ? `Spend ${result.powerUsed} power → ${result.battery} battery, ${result.air} air, ${result.harvest} harvest ${result.harvest === 1 ? 'point' : 'points'} after the shift.`
      : `Needs ${result.powerUsed} power; only ${state.battery} left. Reduce the draft cost to continue.`;

    const warnings = [];
    if (!result.protectedCrew) warnings.push('The standard room leaves the crew exposed. This will end the drill.');
    if (result.air === 0) warnings.push('The air reserve will run out. This will end the drill.');
    const warning = byId('plan-warning');
    warning.textContent = warnings.join(' ');
    warning.hidden = !warnings.length;
    submit.disabled = !result.affordable || !live || Boolean(finish);
    const note = !result.protectedCrew ? 'Particle readings are climbing. The standard room has less shielding.'
      : plan.airMode === 'reserve' && state.air < resourceLimits.air ? 'Reserve air saves power, but this tank was already used last shift.'
        : result.affordable && state.completedShifts === 0 && result.battery < 5 ? 'This draft is affordable now. What will you have left for the peak?'
          : !result.growth ? 'With the lights off, the farm makes no progress toward tomorrow’s harvest.'
            : state.completedShifts === 0 ? 'The crew and farm share this battery. The peak is still ahead.'
              : 'Check both reserves before the peak: battery for the systems and air for the crew.';
    byId('tower-note').textContent = note;
    byId('tower-power').textContent = `Battery: ${state.battery} · Draft cost: ${result.powerUsed} power`;
    const cropCondition = state.harvest >= harvestTarget ? 'On target'
      : state.completedShifts && !state.harvest ? 'Behind schedule' : 'Still growing';
    byId('crop-outlook').textContent = `${cropCondition} · ${state.harvest} of ${harvestTarget} points now. This draft adds ${result.growth} → ${result.harvest} points.`;
    submit.textContent = `Run shift ${state.completedShifts + 1}`;
  }

  function renderState(resources = true) {
    if (resources) {
      for (const key of ['battery', 'air', 'harvest'] as const) {
        const limit = key === 'battery' ? scenarios[state.scenario].battery : resourceLimits[key];
        const meter = byId<HTMLMeterElement>(key);
        meter.max = limit;
        meter.value = state[key];
        byId(`${key}-fill`).style.setProperty('--fill', String(state[key] / limit));
        byId(`${key}-value`).textContent = key === 'harvest' ? `${state.harvest} pts` : `${state[key]} / ${limit}`;
      }
    }
    byId('shift-title').textContent = `${phaseLabel[state.phase]} · ${state.outcome === 'active'
      ? `Shift ${Math.min(shiftCount, state.completedShifts + 1)} of ${shiftCount}` : 'Drill complete'}`;
    byId('tower-phase').textContent = state.phase === 'warning'
      ? 'Warning · Particle readings rising'
      : 'Rising · High particle risk; peak next';
    const crew = state.crew === 'shelter' ? 'protected in the shelter' : 'in habitat · shelter ready';
    byId('tower-crew').textContent = `Crew: ${crew} · Air reserve: ${state.air}`;
    radio.render(state);
  }

  byId('ask-help').addEventListener('click', () => {
    const message = helpCount++ === 0
      ? 'Lights and air share a battery. Using the air tank can free power for the farm, but the tank does not refill during the drill.'
      : state.completedShifts === 0
        ? 'Try shelter, reserve air and full lights for this shift. Save enough battery to use normal air at peak.'
        : 'Try shelter and normal air at peak. Check which light setting brings your harvest closest to 3 points.';
    byId('help-text').textContent = message;
    byId('ask-help').textContent = 'Show a suggested action';
    byId<HTMLButtonElement>('ask-help').disabled = helpCount >= 2;
  });

  function reportLine(result: ShiftProjection) {
    if (state.outcome === 'air' && !result.protectedCrew) return 'The standard room left the crew exposed, and the air reserve ran out.';
    if (state.outcome === 'air') return 'The crew entered the shelter, but the air reserve ran out.';
    if (state.outcome === 'exposure') return 'The standard room left the crew exposed to solar particles.';
    return result.growth
      ? `The shelter protected the crew, and the lights added ${result.growth} harvest ${result.growth === 1 ? 'point' : 'points'}.`
      : 'The shelter protected the crew, but the farm gained no harvest points with the lights off.';
  }

  function renderReport(result: ShiftProjection, before: MissionState) {
    byId('report-title').textContent = `Shift ${state.completedShifts} result`;
    byId('report-line').textContent = reportLine(result);
    const messages = [
      `The outpost used ${result.powerUsed} power. ${state.battery} remains.`,
      state.air === before.air ? `Normal air kept the reserve at ${state.air}.`
        : `Reserve mode used ${before.air - state.air} air. ${state.air} remains.`,
      `Tomorrow’s harvest: ${state.harvest} points. Target: ${harvestTarget}.`,
    ];
    if (state.outcome === 'active') {
      const peak = shiftDemand(state);
      messages.push(`The peak is next. Allow ${peak.addedPower} extra power for air; reserve mode needs ${peak.addedAir} more air too.`);
    }
    byId('report-items').replaceChildren(...messages.map((message) => {
      const item = document.createElement('li');
      item.textContent = message;
      return item;
    }));
    byId<HTMLDetailsElement>('report-details').open = false;
    report.hidden = false;
  }

  function renderDebrief() {
    if (state.outcome === 'active') return;
    const titles = {
      secured: 'Crew protected; harvest secured',
      delayed: 'Crew protected; harvest delayed',
      air: 'Training interrupted',
      exposure: 'Training interrupted',
    };
    const details = {
      secured: 'Later, the crew picked the ripe leaves and brought them to the habitat to share with their stored meal.',
      delayed: state.harvest === 0
        ? 'Later, the crop still needed time. The crew ate stored provisions. Try another light plan to prepare a fresh side.'
        : 'Later, a few leaves were ready to share. Stored provisions kept everyone fed while the rest of the crop grew.',
      air: state.crew === 'standard'
        ? 'The standard room left the crew exposed and reserve mode ran the tank out. Try the shelter with enough air for both shifts.'
        : 'Reserve mode drew air from the tank until it ran out. Try normal air during the peak.',
      exposure: 'Less shielding in the standard room left the crew exposed when particle risk rose. Try sheltering the crew for both shifts.',
    };
    const food = state.harvest >= harvestTarget ? 'Fresh side ready' : state.harvest ? 'Small fresh side' : 'No fresh side yet';
    const safe = state.phase === 'recovery';
    byId('outcome').textContent = titles[state.outcome];
    byId('outcome-detail').textContent = details[state.outcome];
    byId('outcome-resources').textContent = `${state.battery} battery · ${state.air} air · ${state.harvest} of ${harvestTarget} harvest points${safe ? ` · ${food}` : ''}`;
    debrief.hidden = false;
    byId('outcome').focus();
    present({ type: 'debrief', state });
  }

  function stopResolution() {
    clearTimeout(timer);
    clearTimeout(captionTimer);
    finish = undefined;
    resolution.hidden = true;
  }

  function playResolution(duration: number, onFinish: () => void, caption: string) {
    const complete = () => { stopResolution(); onFinish(); };
    if (motion.matches) return complete();
    finish = complete;
    resolution.hidden = false;
    byId('resolution-title').focus();
    captionTimer = window.setTimeout(() => { byId('resolution-caption').textContent = caption; }, duration * .62);
    timer = window.setTimeout(complete, duration);
  }

  function playRecovery() {
    state = recover(state);
    renderState();
    byId('resolution-phase').textContent = 'Recovery · Later…';
    byId('resolution-title').textContent = state.harvest ? 'Bringing fresh food back' : 'Checking the greenhouse';
    document.querySelector('#risk-trace')!.setAttribute('hidden', '');
    byId('resolution-readout').textContent = 'Simulated particle risk has eased. The crew can leave the shelter.';
    byId('resolution-caption').textContent = state.harvest
      ? 'The crew is picking ripe leaves from crops that were already growing.'
      : 'The crop needs more time. Stored food is ready at the habitat.';
    present({ type: 'recovery', state, duration: motion.matches ? 0 : 5500 });
    playResolution(5500, renderDebrief, state.harvest
      ? 'Fresh leaves arrive at the habitat for the crew’s meal.' : 'The crew heads back to the habitat for their meal.');
  }

  byId('skip-resolution').addEventListener('click', () => finish?.());
  motion.addEventListener('change', () => { if (motion.matches) finish?.(); });
  form.addEventListener('change', renderPreview);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!live || finish) return;
    const committed = commitShift(state, draft());
    if (!committed) return;

    const previous = state;
    const { next, result } = committed;
    state = next;
    closeFacility();
    form.hidden = true;
    navigation.enable(false);
    if (state.outcome !== 'active') radio.cancelPending();
    renderState(false);
    byId('shift-title').textContent = `${phaseLabel[state.phase]} · Running shift ${state.completedShifts} of ${shiftCount}`;
    byId('resolution-phase').textContent = `${phaseLabel[state.phase]} · Simulated particle monitor`;
    byId('resolution-title').textContent = `Running shift ${state.completedShifts}`;
    const trace = document.querySelector<SVGSVGElement>('#risk-trace')!;
    trace.removeAttribute('hidden');
    trace.dataset.phase = state.phase;
    byId('resolution-readout').textContent = `Particle risk: ${state.phase === 'peak' ? 'Highest this drill' : 'High and rising'} · ${result.protectedCrew ? 'Storm shelter' : 'Standard room'}`;
    byId('resolution-caption').textContent = `Battery → Air system: ${result.airPower} · Shelter: ${Number(result.protectedCrew)} · Grow lights: ${result.lightPower}`;
    present({ type: 'shift', previous, state, result, duration: motion.matches ? 0 : 6000 });
    playResolution(6000, () => {
      present({ type: 'settled', state });
      renderState();
      renderReport(result, previous);
      if (state.outcome === 'active') {
        form.hidden = false;
        navigation.enable(true);
        renderPreview();
        byId('report-title').focus();
      } else if (state.outcome === 'secured' || state.outcome === 'delayed') playRecovery();
      else renderDebrief();
    }, reportLine(result));
  });

  function reset(nextScenario: Scenario = state.scenario) {
    stopResolution();
    state = startMission(nextScenario);
    radio.reset();
    present({ type: 'reset', state });
    report.hidden = true;
    debrief.hidden = true;
    form.hidden = false;
    navigation.enable(live);
    location.value = defaultPlan.location;
    airMode.value = defaultPlan.airMode;
    lights.value = defaultPlan.lights;
    helpCount = 0;
    byId('help-text').textContent = '';
    byId('ask-help').textContent = 'Ask for a hint';
    byId<HTMLButtonElement>('ask-help').disabled = false;
    renderState();
    renderPreview();
    if (live) openBuilding(buildings[1]);
  }

  byId('harvest-target').textContent = String(harvestTarget);
  byId('restart-resolution').addEventListener('click', () => reset());
  byId('retry').addEventListener('click', () => reset(scenario.value as Scenario));
  reset();

  return {
    openBuilding,
    enter() {
      live = true;
      navigation.enable(true);
      renderPreview();
      openBuilding(buildings[1]);
    },
  };
}
