import { landmarkIds, landmarkRadius, lunarLandmarks, type LandmarkId } from '../data/lunarLandmarks';
import { impactParts } from '../mission/lunarHazards';
import type { SurfacePanel } from './buildingControls';
import { cacheIds, cacheSites, estimateDriveCost, radarRange, roverBounds, tractionAt, type CacheId } from '../mission/lunarSurface';
import { mountFlightScene } from '../scenes/FlightScene';
import { mountReturnRoute } from './flightRoute';
import { renderMissionScore } from './missionDebrief';
import { resourceChange } from './resourceChange';
import { crew, type CrewId } from '../data/crew';
import {
  activeBuilders, atDestination, cargoCapacity, isDocked, jobs, locations, returnSteps, roverCapacity, shipLoad, shelteredCount,
  type DriveInput, type Job,
} from '../mission/lunarCampaign';
import {
  assignJob, cacheCollectionBlock, landmarkBlock, nearbyLandmark, daysRemaining, departureCountdown, missionDay, departureChecks, departureStatus, facilityJobs, jobBlock, launchReturn, nearbyCache, nextBuild, releaseDepartureJobs, returnCommand,
  crewActivity, jobAvailability, jobDuration, jobPreview, outpostIncident, roverCommand, outpostStorm, type OutpostState,
} from '../mission/outpostSimulation';

type FacilityTarget = 'farm' | 'control' | 'comms' | number;
const driveKeys = {
  forward: ['ArrowUp', 'KeyW'],
  reverse: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
} as const;

export function mountCampaignControls(
  host: HTMLElement,
  state: () => OutpostState,
  changed: () => void,
  changeView: (driving: boolean) => void,
  openPanel: (panel: SurfacePanel, trigger?: HTMLElement) => void,
  openLandmark: (id: LandmarkId, trigger?: HTMLElement) => void,
) {
  const facilityPanel = host.querySelector('#sim-facility-panel')!;
  const jobDeck = document.createElement('section');
  jobDeck.className = 'campaign-jobs';
  jobDeck.innerHTML = '<h3>Jobs</h3><p>Cooldowns belong to the job. An available astronaut can take another job.</p><div id="campaign-job-list"></div><p id="campaign-job-message" role="status"></p>';
  facilityPanel.append(jobDeck);
  const crewList = document.createElement('ul');
  crewList.className = 'campaign-crew';
  crewList.setAttribute('aria-label', 'Crew locations');
  const rosterNotice = document.createElement('p');
  rosterNotice.className = 'visually-hidden';
  rosterNotice.setAttribute('role', 'status');
  let previousActivities: string[] | undefined;
  const crewRows = crew.map(member => {
    const row = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = member.name;
    name.style.color = `#${member.color.toString(16)}`;
    const status = document.createElement('span');
    const role = document.createElement('small');
    role.textContent = member.role;
    row.append(name, role, status); crewList.append(row);
    return status;
  });
  host.querySelector('#sim-crew-roster')!.append(crewList, rosterNotice);

  const panels = document.createElement('div');
  panels.innerHTML = `
    <section id="campaign-rover" class="console sim-facility-panel campaign-rover" hidden aria-labelledby="rover-title">
      <header><div><p class="eyebrow">Surface expedition</p><h2 id="rover-title" tabindex="-1">Lunar rover</h2></div><button class="icon-button" data-campaign-close aria-label="Close rover">×</button></header>
      <p id="rover-charge"></p><p id="rover-specimens"></p>
      <div id="rover-docked">
        <label for="rover-driver">Driver</label>
        <select id="rover-driver">${crew.map(member => `<option value="${member.id}">${member.name}</option>`).join('')}</select>
        <div class="campaign-actions"><button class="action" data-rover="board">Board rover</button><button class="radio-action" data-rover="charge">Charge from base</button></div>
      </div>
      <div id="rover-away" hidden>
        <p id="rover-navigation"></p><p id="rover-target"></p><p id="rover-geology" hidden></p><button class="radio-action" id="rover-read-landmark" hidden>Read exhibit</button>
        <div class="rover-map" aria-hidden="true"><i class="radar-pulse" hidden></i><span data-map="dock">Dock</span>${cacheIds.map(id => `<span data-map="${id}" hidden>${cacheSites[id].name}</span>`).join('')}<span data-map="heritage">Overlook</span>${landmarkIds.map(id => `<span class="geology-pin" data-map="${id}" title="${lunarLandmarks[id].name}">◆</span>`).join('')}<span data-map="rover">▲</span></div>
        <label for="rover-waypoint">Waypoint</label>
        <select id="rover-waypoint"><option value="dock">Outpost dock</option>${cacheIds.map(id => `<option value="${id}" hidden disabled>${cacheSites[id].name}</option>`).join('')}<option value="heritage">Apollo 12 overlook</option><optgroup label="Geology stops">${landmarkIds.map(id => `<option value="${id}">${lunarLandmarks[id].name}</option>`).join('')}</optgroup></select>
        <div class="drive-pad" aria-label="Rover steering">
          <button data-drive="left" aria-label="Steer left">◀</button><button data-drive="forward" aria-label="Drive forward">▲</button><button data-drive="right" aria-label="Steer right">▶</button><button data-drive="reverse" aria-label="Reverse">▼</button>
        </div>
        <p>W or ↑ drives forward. S or ↓ reverses. A or ← steers left. D or → steers right.</p>
        <button class="radio-action" data-campaign-close>Park &amp; return to base view</button>
        <p>Parking restores fast-forward. The driver stays with the rover until you dock.</p>
        <div class="campaign-actions">
          <button class="radio-action" data-rover="dock">Dock & unload</button>
          <button class="radio-action" data-rover="scan">Radar sweep · 0.6 charge</button>
          <button class="radio-action" data-rover="collect">Collect cache</button>
          <button class="radio-action" data-rover="visit">Read site exhibit</button>
          <button class="radio-action" data-rover="rescue">Request tow · 5 materials</button>
        </div>
      </div>
      <p id="rover-sectors"></p><p id="rover-cache-block"></p><p id="rover-message" role="status"></p>
      <details id="rover-exhibit" hidden>
        <summary>Apollo 12 and Surveyor 3 · field exhibit</summary>
        <figure class="heritage-diagram" aria-label="Surveyor 3 landed in 1967. In 1969, Apollo 12 landed nearby and its crew visited Surveyor 3.">
          <div><strong>1967</strong><span>Surveyor 3 lands</span></div><div><strong>1969</strong><span>Apollo 12 lands nearby</span></div><div><strong>Earth lab</strong><span>Camera and parts studied</span></div>
        </figure>
        <p>Precision landing let the crew walk to Surveyor 3 and bring back hardware for scientists to study after years of lunar exposure. This overlook and the supply cache use fictional locations and compressed distances.</p>
        <a href="https://www.nasa.gov/missions/apollo/apollo-12-the-pinpoint-mission/" target="_blank" rel="noopener">NASA · The Pinpoint Mission</a>
      </details>
    </section>
    <section id="campaign-departure" class="console sim-facility-panel" hidden aria-labelledby="departure-title">
      <header><h2 id="departure-title" tabindex="-1">Return to Earth</h2><button class="icon-button" data-campaign-close aria-label="Close departure">×</button></header>
      <button type="button" class="radio-action" id="departure-briefing" aria-haspopup="dialog">Departure briefing</button>
      <ul class="departure-checks">
        <li id="departure-time"></li><li id="departure-weather"></li>
        <li id="departure-rover"></li><li id="departure-shelter"></li><li id="departure-jobs"></li>
      </ul>
      <div class="campaign-actions departure-actions">
        <button class="radio-action" id="departure-open-rover" hidden>Open rover controls</button>
        <button class="radio-action" id="departure-release-shelter" hidden>Release crew from shelter</button>
        <button class="radio-action" id="departure-release-jobs" hidden>Cancel remaining jobs</button>
      </div>
      <p id="departure-safety" hidden>Wait for the storm to pass before releasing the crew from shelter.</p><h3>Supplies to load</h3><ul class="departure-checks" id="departure-supplies"></ul>
      <button class="action" id="departure-launch">Board return ship</button>
    </section>
    <section id="campaign-return" class="return-chapter flight-active" hidden aria-labelledby="return-title">
      <header class="flight-heading">
        <div><p class="eyebrow">Mission Control / Moon to Earth</p><h2 id="return-title" tabindex="-1"></h2></div>
        <div id="return-reserves" class="flight-resources" aria-label="Return reserves in training units"></div>
        <div class="return-utilities flight-utilities"></div>
      </header>
      <div class="flight-layout">
        <section class="flight-console console" aria-label="Return mission operations">
          <div class="flight-panel-title"><h3>Mission operations</h3><span>COMMAND</span></div>
          <ol id="return-stages" class="flight-sections" aria-label="Return flight stages">${returnSteps.map(step => `<li>${step.title}</li>`).join('')}</ol>
          <dl id="return-telemetry" class="flight-telemetry" aria-label="Simulated return telemetry">
            <div><dt>Mission elapsed</dt><dd data-met></dd></div><div><dt>Velocity</dt><dd data-speed></dd></div>
            <div><dt>Earth range</dt><dd data-range></dd></div><div><dt>Flight status</dt><dd data-flight-status></dd></div>
          </dl>
          <div class="flight-readback">
            <div class="flight-radio"><img src="/media/crew-leena.webp" width="36" height="36" alt=""><strong>Leena / Crew radio</strong></div>
            <p id="return-brief" class="flight-caption"></p><p id="return-result" class="flight-notice" role="status"></p>
          </div>
          <div id="return-actions" class="flight-actions"></div>
          <div id="return-score" class="mission-score" hidden></div>
          <button id="return-restart" class="action" hidden>Start a new mission</button><button id="return-menu" class="radio-action">Chapter menu</button>
        </section>
        <div class="flight-visuals">
          <section class="flight-stage" aria-label="Exterior camera">
            <div class="flight-panel-title"><h3>Exterior camera</h3><span id="return-camera-status"></span></div>
            <div class="flight-stage-picture"><div id="return-camera" class="flight-scene"></div></div>
          </section>
          <section class="flight-map console" aria-label="Return trajectory">
            <div class="flight-panel-title"><h3>Mission trajectory</h3><span>SIM</span></div>
            <div class="flight-map-body"><div id="return-route" class="flight-route"></div><p class="flight-map-legend">Illustrative route and telemetry</p></div>
          </section>
        </div>
      </div>
    </section>`;
  host.append(panels);
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => host.querySelector<T>(selector)!;
  const keys = new Set<string>();
  const pointerKeys = new Set<string>();
  const queuedDrive = new Map<string,number>();
  let open: SurfacePanel | undefined;
  let returnStage = -1;
  let returnScene: ReturnType<typeof mountFlightScene> | undefined;
  let returnRoute: ReturnType<typeof mountReturnRoute> | undefined;
  let returnFrame = 0;
  let lastReturnReserves: { fuel: number; battery: number; oxygen: number } | undefined;
  const supplyNames = { materials: 'Materials', battery: 'Power', oxygen: 'Oxygen', food: 'Food' };
  const departureSupplyRows = Object.keys(shipLoad).map(() => {
    const item = document.createElement('li');
    q('#departure-supplies').append(item);
    return item;
  });
  function clearInput() { keys.clear(); pointerKeys.clear(); queuedDrive.clear(); }
  function updateMode() { changeView(open === 'rover' && !!state().campaign.rover.driver); }
  let panelTrigger: HTMLElement | undefined;
  function close() {
    if (open === 'rover') {
      const vehicle = state().campaign.rover;
      vehicle.velocity = vehicle.steering = 0;
    }
    open = undefined;
    panelTrigger?.setAttribute('aria-expanded', 'false');
    panelTrigger = undefined;
    clearInput();
    q('#campaign-rover').hidden = true;
    q('#campaign-departure').hidden = true;
    updateMode();
  }
  function show(panel: SurfacePanel, trigger?: HTMLElement, focus = true) {
    close();
    open = panel;
    panelTrigger = trigger ?? document.querySelector<HTMLElement>(`[data-surface="${panel}"]`) ?? undefined;
    panelTrigger?.setAttribute('aria-expanded', 'true');
    q(`#campaign-${panel}`).hidden = false;
    updateMode();
    render();
    if (focus) q(panel === 'rover' ? '#rover-title' : '#departure-title').focus();
  }

  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]') || open !== 'rover' || !state().campaign.rover.driver || (event.target as HTMLElement).matches('select, input, textarea') || event.altKey || event.metaKey || event.ctrlKey) return;
    const direction = Object.entries(driveKeys).find(([, codes]) => codes.some(code => code === event.code))?.[0];
    if (!direction) return;
    event.preventDefault();
    keys.add(event.code);
    if (!event.repeat) queuedDrive.set(direction, performance.now() + 115);
  });
  document.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); });
  host.querySelectorAll<HTMLButtonElement>('[data-drive]').forEach(button => {
    const direction = button.dataset.drive!;
    button.onpointerdown = event => {
      button.setPointerCapture(event.pointerId);
      pointerKeys.add(direction);
      queuedDrive.set(direction, performance.now() + 115);
    };
    button.onlostpointercapture = () => pointerKeys.delete(direction);
    button.onkeydown = event => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault(); pointerKeys.add(direction); queuedDrive.set(direction, performance.now() + 115);
      }
    };
    button.onkeyup = button.onblur = () => pointerKeys.delete(direction);
  });
  host.querySelectorAll<HTMLButtonElement>('[data-campaign-close]').forEach(button => button.onclick = () => {
    const trigger = panelTrigger;
    close();
    trigger?.focus();
  });
  q('#campaign-rover').addEventListener('keydown', event => { if (event.key === 'Escape') q('#campaign-rover [data-campaign-close]').click(); });
  q('#campaign-departure').addEventListener('keydown', event => { if (event.key === 'Escape') q('#campaign-departure [data-campaign-close]').click(); });
  host.querySelectorAll<HTMLButtonElement>('[data-rover]').forEach(button => button.onclick = () => {
    const action = button.dataset.rover as Parameters<typeof roverCommand>[1];
    const driver = q<HTMLSelectElement>('#rover-driver').value as CrewId;
    const scanBefore = state().campaign.rover.radarReady;
    const message = roverCommand(state(), action, driver, button.dataset.cache as CacheId | undefined);
    q('#rover-message').textContent = message;
    if (action === 'dock' && message.startsWith('Rover docked')) state().message = message;
    if (action === 'scan' && state().campaign.rover.radarReady !== scanBefore) {
      const pulse = q('.radar-pulse');
      const [x,z] = state().campaign.rover.position;
      pulse.style.left = `${(x-roverBounds.left)/(roverBounds.right-roverBounds.left)*100}%`;
      pulse.style.top = `${(z-roverBounds.top)/(roverBounds.bottom-roverBounds.top)*100}%`;
      pulse.hidden = false;
      window.setTimeout(() => { pulse.hidden = true; }, 650);
    }
    if (action === 'visit' && state().campaign.rover.heritage) q<HTMLDetailsElement>('#rover-exhibit').open = true;
    if (action === 'board' && state().campaign.rover.driver) {
      q<HTMLSelectElement>('#rover-waypoint').value = firstContact(state()) ?? 'heritage';
      q('[data-drive="forward"]').focus();
    }
    updateMode(); changed();
  });
  q('#rover-waypoint').onchange = () => render();
  q('#rover-read-landmark').onclick = () => {
    const site = nearbyLandmark(state());
    if (site) openLandmark(site, q('#rover-read-landmark'));
  };
  q('#departure-open-rover').onclick = () => openPanel('rover');
  q('#departure-release-shelter').onclick = () => {
    if (!departureStatus(state()).stormClear) return;
    state().sheltered = false;
    changed();
  };
  q('#departure-release-jobs').onclick = () => { releaseDepartureJobs(state()); changed(); };
  q('#departure-launch').onclick = () => {
    if (!launchReturn(state())) return;
    close();
    changed();
    q('#return-title').focus();
  };
  q('#return-menu').onclick = () => location.reload();
  q('#return-restart').onclick = () => {
    try { sessionStorage.setItem('lunar-start-new-mission', 'true'); } catch { /* Return to the chapter menu if storage is unavailable. */ }
    location.reload();
  };

  let displayedTarget: FacilityTarget | undefined;
  function renderJobs(target?: FacilityTarget) {
    const mission = state();
    const offers = target === undefined ? [] : facilityJobs(mission, target);
    if (target !== displayedTarget || offers.length !== q('#campaign-job-list').childElementCount) {
      displayedTarget = target;
      q('#campaign-job-message').textContent = '';
      q('#campaign-job-list').replaceChildren();
      for (const job of offers) {
        const spec = jobs[job];
        const row = document.createElement('article');
        row.dataset.job = job;
        row.innerHTML = `<h4>${spec.name}</h4><p>${spec.reward}</p><p data-job-cost hidden></p><label for="worker-${job}">Astronaut</label>
          <select id="worker-${job}">${crew.map(member => `<option value="${member.id}" ${spec.specialist === member.id ? 'selected' : ''}>${member.name}</option>`).join('')}</select>
          <p class="job-status"></p><p data-worker-block hidden></p><button class="radio-action">Assign job</button>`;
        const select = row.querySelector('select')!;
        select.onchange = () => renderJobs(target);
        row.querySelector('button')!.onclick = () => {
          const current = state();
          const id = select.value as CrewId;
          const assigned = Object.values(current.campaign.workers).find(worker => worker.assignment?.job === job && worker.assignment.plot === (typeof target === 'number' ? target : undefined));
          if (assigned) delete assigned.assignment;
          else q('#campaign-job-message').textContent = assignJob(current, id, job, typeof target === 'number' ? target : undefined);
          changed();
        };
        q('#campaign-job-list').append(row);
      }
    }
    jobDeck.hidden = target === undefined || !q('#campaign-job-list').childElementCount;
    for (const row of q('#campaign-job-list').querySelectorAll<HTMLElement>('[data-job]')) {
      const job = row.dataset.job as Job;
      const id = row.querySelector('select')!.value as CrewId;
      const plot = typeof target === 'number' ? target : undefined;
      const assigned = crew.find(member => {
        const a = mission.campaign.workers[member.id].assignment;
        return a?.job === job && a.plot === plot;
      });
      const blocked = jobBlock(mission, id, job, plot);
      const availability = jobAvailability(mission, job, plot);
      const cost = row.querySelector<HTMLElement>('[data-job-cost]')!;
      const preview = job === 'arrayRepair' ? outpostIncident(mission)?.partsReserved ? 'Repair parts reserved' : `−${impactParts} materials on assignment`
        : jobPreview(mission, job);
      cost.hidden = !preview;
      cost.textContent = preview && job !== 'arrayRepair' ? `At current reserves · ${preview}` : preview;
      const button = row.querySelector('button')!;
      button.textContent = assigned ? 'Cancel job' : 'Assign job';
      button.disabled = assigned ? mission.outcome !== 'active' : !!blocked;
      row.querySelector('select')!.disabled = !!assigned;
      const workerBlock = row.querySelector<HTMLElement>('[data-worker-block]')!;
      workerBlock.hidden = !!availability || !blocked;
      workerBlock.textContent = workerBlock.hidden ? '' : blocked;
      const currentAssignee = crew.find(member => mission.campaign.workers[member.id].assignment?.job === job);
      const duration = jobDuration(job, id);
      row.querySelector('.job-status')!.textContent = currentAssignee
        ? `Assigned to ${currentAssignee.name} · ${crewActivity(mission, currentAssignee.id)}`
        : availability || `Ready · ${departureCountdown(duration)} of work${jobs[job].specialist === id ? ' with the specialist' : ''}`;
    }
  }

  function renderReturn(mission: OutpostState) {
    const flight = mission.campaign.flight;
    const chapter = q('#campaign-return');
    chapter.hidden = !flight;
    for (const child of Array.from(host.children)) if (child !== panels) (child as HTMLElement).inert = !!flight;
    document.querySelector('.outpost')?.classList.toggle('return-active', !!flight);
    const utilityPill = host.querySelector('.utility-pill');
    const utilityHost = q(flight ? '.return-utilities' : '.sim-utilities');
    if (utilityPill && utilityPill.parentElement !== utilityHost) utilityHost.append(utilityPill);
    if (!flight || returnStage === flight.stage) return;
    returnStage = flight.stage;
    chapter.dataset.stage = String(flight.stage);
    const step = returnSteps[flight.stage];
    q('#return-title').textContent = step?.title ?? 'Crew recovered';
    q('#return-brief').textContent = step?.instruction ?? `All five astronauts returned safely after ${(mission.elapsed / 60).toFixed(1)} mission days. Recovered ${mission.campaign.rover.delivered} materials.${mission.campaign.rover.heritage ? ' Explored the Apollo 12 and Surveyor 3 overlook.' : ''}`;
    returnScene ??= mountFlightScene(q('#return-camera'));
    returnRoute ??= mountReturnRoute(q('#return-route'), q('#return-telemetry'));
    returnRoute(flight.stage);
    q('#return-camera-status').textContent = step?.title.toUpperCase() ?? 'RECOVERY';
    const started = performance.now();
    const stage = flight.stage;
    cancelAnimationFrame(returnFrame);
    const draw = (now: number) => {
      const reduced = document.documentElement.classList.contains('reduce-motion');
      const elapsed = Math.max(0, (now - started) / 1000);
      returnScene?.update({ phase: 'coast', returnStage: stage, elapsed, reduced, paused: false });
      if (!reduced && !document.hidden) returnFrame = requestAnimationFrame(draw);
    };
    draw(started);
    const reserves = ['fuel', 'battery', 'oxygen'] as const;
    q('#return-reserves').replaceChildren(...reserves.map(key => {
      const card = document.createElement('div');
      const label = document.createElement('span'); label.textContent = key;
      const reading = document.createElement('strong'); reading.textContent = String(flight[key]);
      card.append(label, reading);
      const before = lastReturnReserves?.[key];
      if (before !== undefined && before !== flight[key]) {
        reading.dataset.change = 'loss';
        card.append(resourceChange('', before, flight[key]));
      }
      return card;
    }));
    lastReturnReserves = { ...flight };
    q('#return-restart').hidden = !!step;
    q('#return-score').hidden = !!step;
    if (!step) renderMissionScore(q('#return-score'), mission);
    q('#return-result').textContent = '';
    q('#return-actions').replaceChildren();
    q('#return-stages').querySelectorAll('li').forEach((item, index) => {
      item.dataset.status = index < flight.stage ? 'done' : 'next';
      if (index === flight.stage) item.setAttribute('aria-current','step'); else item.removeAttribute('aria-current');
    });
    step?.choices.forEach((choice, index) => {
      const button = document.createElement('button'); button.className = 'radio-action'; button.textContent = choice;
      button.onclick = () => {
        const error = returnCommand(state(), stage, index);
        if (error) q('#return-result').textContent = error;
        else { changed(); q('#return-title').focus(); }
      };
      const command = document.createElement('div');
      command.className = 'flight-command';
      command.dataset.command = 'ready';
      const status = document.createElement('small');
      status.textContent = 'REQUEST COMMAND';
      command.append(button, status);
      q('#return-actions').append(command);
    });
  }

  function firstContact(mission: OutpostState) {
    const { rover } = mission.campaign;
    return rover.contacts.find(id => !rover.collected.includes(id));
  }

  function render(target?: FacilityTarget) {
    const mission = state();
    const { campaign } = mission;
    const { rover } = campaign;
    const plot = nextBuild(mission)?.plot;
    if (target === 'control') {
      const activities = crew.map(member => crewActivity(mission, member.id));
      activities.forEach((activity, i) => { crewRows[i].textContent = activity; });
      const modes = activities.map(activity => activity.split(' · ')[0]);
      const transitions = previousActivities && modes.flatMap((mode, i) =>
        mode === previousActivities![i] ? [] : [`${crew[i].name}, ${mode}.`]);
      if (transitions?.length) rosterNotice.textContent = transitions.join(' ');
      previousActivities = modes;
      const builders = activeBuilders(campaign, plot, mission.sheltered);
      const assigned = crew.filter(member => !!campaign.workers[member.id].assignment).length;
      const drivers = Number(!!rover.driver);
      const inside = shelteredCount(campaign, mission.sheltered);
      const available = mission.sheltered ? 0 : crew.length - builders.length - assigned - drivers;
      const working = activities.filter(activity => /^(Working|Building) ·/.test(activity)).length;
      q('#sim-crew-summary').textContent = `${available} available · ${working} working · ${drivers} rover driver. Location totals: ${crew.length - inside} outside shelter · ${inside} sheltered.`;
    } else {
      previousActivities = undefined;
      rosterNotice.textContent = '';
    }
    renderJobs(target);
    const aboard = landmarkIds.filter(id => rover.specimens[id] === 'aboard');
    const delivered = landmarkIds.filter(id => rover.specimens[id] === 'delivered');
    q('#rover-specimens').textContent = `Specimen rack ${aboard.length}/${landmarkIds.length} · ${delivered.length} logged at the outpost`;
    q('#rover-docked').hidden = !isDocked(rover);
    q('#rover-away').hidden = isDocked(rover);
    q('#rover-exhibit').hidden = !rover.heritage;
    q('#rover-charge').textContent = `Charge ${rover.charge.toFixed(1)} / ${roverCapacity} · Cargo ${rover.cargo} / ${cargoCapacity} materials`;
    const selection = q<HTMLSelectElement>('#rover-waypoint');
    const available = rover.contacts.filter(id => !rover.collected.includes(id));
    for (const option of Array.from(selection.options)) {
      if (!cacheIds.includes(option.value as CacheId)) continue;
      option.hidden = option.disabled = !available.includes(option.value as CacheId);
    }
    if (!selection.value || selection.selectedOptions[0]?.disabled) selection.value = firstContact(mission) ?? 'dock';
    const waypoint = selection.value as 'dock' | 'heritage' | CacheId | LandmarkId;
    const [x,z] = rover.position;
    const points: Record<string, readonly [number, number]> = { dock: locations.dock, heritage: locations.heritage, rover: rover.position,
      ...Object.fromEntries(cacheIds.map(id => [id,cacheSites[id].point])),
      ...Object.fromEntries(landmarkIds.map(id => [id,lunarLandmarks[id].point])) };
    for (const [name, point] of Object.entries(points)) {
      const pin = q(`[data-map="${name}"]`);
      pin.style.left = `${(point[0]-roverBounds.left)/(roverBounds.right-roverBounds.left)*100}%`;
      pin.style.top = `${(point[1]-roverBounds.top)/(roverBounds.bottom-roverBounds.top)*100}%`;
      pin.hidden = cacheIds.includes(name as CacheId) && !available.includes(name as CacheId);
    }
    q('[data-map="rover"]').style.rotate = `${Math.PI-rover.heading}rad`;
    const destination = points[waypoint] ?? locations.dock;
    const angle = Math.atan2(destination[0]-x,destination[1]-z)-rover.heading;
    const bearing = Math.atan2(Math.sin(angle),Math.cos(angle));
    const direction = Math.abs(bearing) < .23 ? 'straight ahead' : bearing > 0 ? 'turn left' : 'turn right';
    const distance = Math.hypot(destination[0]-x,destination[1]-z);
    const home = estimateDriveCost(rover.position, locations.dock);
    const terrain = tractionAt(x,z) < .79 ? 'rough ground' : 'firm ground';
    q('#rover-navigation').textContent = rover.rescue
      ? `Tow arrives in ${daysRemaining(rover.rescue)}.`
      : `Return estimate ${home.toFixed(1)} charge · ${Math.abs(rover.velocity).toFixed(1)} units/s · ${terrain}${rover.charge < home ? ' · low charge' : ''}`;
    q('#rover-target').textContent = `${distance.toFixed(1)} grid units · ${distance < (landmarkIds.includes(waypoint as LandmarkId) ? landmarkRadius : 2.4) ? 'within reach' : direction}`;
    const landmark = nearbyLandmark(mission);
    const geologyBlock = landmark ? landmarkBlock(mission, landmark) : '';
    q('#rover-geology').hidden = !landmark;
    q('#rover-geology').textContent = landmark ? `${lunarLandmarks[landmark].name} · ${geologyBlock || 'Exhibit ready'}` : '';
    q('#rover-read-landmark').hidden = !landmark || !!geologyBlock;
    const sectors = cacheIds.filter(id => !rover.contacts.includes(id)).map(id => cacheSites[id].sector);
    q('#rover-sectors').textContent = sectors.length ? `Radar range ${radarRange} units. Unconfirmed signals: ${sectors.join('; ')}.` : 'All radar contacts identified.';
    const active = mission.outcome === 'active' && !campaign.flight;
    const safe = !mission.sheltered && outpostStorm(mission) !== 'peak';
    const depot = q<HTMLSelectElement>('#rover-driver');
    Array.from(depot.options).forEach(option => { option.disabled = !!campaign.workers[option.value as CrewId].assignment; });
    if (depot.selectedOptions[0]?.disabled) depot.value = Array.from(depot.options).find(option => !option.disabled)?.value ?? '';
    q<HTMLButtonElement>('[data-rover="board"]').disabled = !active || !safe || !depot.value || rover.charge < 1;
    q<HTMLButtonElement>('[data-rover="charge"]').disabled = !active || mission.battery <= 5 || rover.charge >= roverCapacity;
    q<HTMLButtonElement>('[data-rover="dock"]').disabled = !active || !!rover.rescue || !atDestination(rover,'dock');
    const cache = nearbyCache(mission) ?? (cacheIds.includes(waypoint as CacheId) ? waypoint as CacheId : undefined);
    const collect = q<HTMLButtonElement>('[data-rover="collect"]');
    const cacheBlock = cacheCollectionBlock(mission, cache);
    collect.dataset.cache = cache ?? '';
    collect.disabled = !!cacheBlock;
    q('#rover-cache-block').textContent = cacheBlock;
    collect.textContent = cache ? `Collect ${cacheSites[cache].name}` : 'Collect cache';
    q<HTMLButtonElement>('[data-rover="scan"]').disabled = !active || rover.charge < .6 || !!rover.rescue || rover.radarReady > mission.elapsed;
    q<HTMLButtonElement>('[data-rover="visit"]').disabled = !active || !atDestination(rover,'heritage');
    q<HTMLButtonElement>('[data-rover="rescue"]').disabled = !active || !!rover.rescue || mission.materials < 5;
    const checks = departureChecks(mission);
    const detail = departureStatus(mission);
    const row = (item: HTMLElement, passed: boolean, label: string) => {
      item.dataset.check = passed ? 'complete' : 'pending';
      item.textContent = `${passed ? '✓' : '○'} ${label}`;
    };
    const { window } = detail;
    row(q('#departure-time'), window.open, window.open
      ? `Window ${window.cycle} open · ${departureCountdown(window.closeTick - mission.elapsed)} left · closes ${missionDay(window.closeTick)}`
      : `Window closed · opens ${missionDay(window.nextOpening)} in ${departureCountdown(window.nextOpening - mission.elapsed)}`);
    row(q('#departure-weather'), detail.stormClear, detail.stormClear ? 'Storm clear for departure' : 'Wait for the storm to clear');
    const driver = crew.find(member => member.id === rover.driver);
    row(q('#departure-rover'), detail.docked, detail.docked ? 'Rover docked and driver released' : `${driver?.name ?? 'Driver'} is aboard · ${atDestination(rover, 'dock') ? 'select Dock & unload' : 'return to the dock, then unload'}`);
    row(q('#departure-shelter'), detail.shelterReleased, detail.shelterReleased ? 'Shelter order lifted' : 'Shelter order is still active');
    row(q('#departure-jobs'), detail.activeJobs.length === 0, detail.activeJobs.length === 0 ? 'No active jobs' : detail.activeJobs.map(member => `${member.name} · ${jobs[campaign.workers[member.id].assignment!.job].name}`).join(' / '));
    detail.supplies.forEach(({key, available, required}, i) => {
      const ready = available >= required;
      const shown = (Math.floor(available * 100) / 100).toFixed(key === 'materials' ? 0 : 2);
      const gap = Math.ceil((required - available) * 100) / 100;
      row(departureSupplyRows[i], ready, `${supplyNames[key]} · ${shown} / ${required}${ready ? '' : ` · need ${gap.toFixed(2)} more`}`);
    });
    q('#departure-open-rover').hidden = !active || detail.docked;
    q('#departure-safety').hidden = !active || detail.shelterReleased || detail.stormClear;
    q('#departure-release-shelter').hidden = !active || detail.shelterReleased || !detail.stormClear;
    q('#departure-release-jobs').hidden = !active || !detail.activeJobs.length;
    q<HTMLButtonElement>('#departure-launch').disabled = !active || !Object.values(checks).every(Boolean);
    renderReturn(mission);
  }

  return {
    show, close, render, clearInput,
    get driving() { return open === 'rover' && !!state().campaign.rover.driver; },
    driveInput(): DriveInput {
      if (open !== 'rover') return { throttle: 0, turn: 0 };
      const down = (direction: keyof typeof driveKeys) => Number((queuedDrive.get(direction) ?? 0) > performance.now() || pointerKeys.has(direction) || driveKeys[direction].some(code => keys.has(code)));
      const input = {
        throttle: down('forward') - down('reverse'),
        // Positive yaw turns left when viewed from behind the rover.
        turn: down('left') - down('right'),
      };
      return input;
    },
  };
}
