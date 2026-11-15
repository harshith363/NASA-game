import { cacheIds, cacheSites, missionSunElevation } from '../mission/lunarSurface';
import { locations, shelter, workerStatus } from '../mission/lunarCampaign';
import { box, disposeModel, expansionModel, roverModel } from './campaignModels';
import { plots, constructionTypes, nextBuild, stormAt, type OutpostState } from '../mission/outpostSimulation';
import * as THREE from 'three';
import { crew as crewRoster } from '../data/crew';
import { buildings, type Building } from '../data/buildings';
import { hasParticleRisk, type MissionState, type StormPhase } from '../mission/dailyMission';
import type { MissionEvent } from '../mission/presentation';
import type { MotionPreference } from '../ui/motionPreference';
import { makeFacility } from './facilities';
import { createAstronaut, createLander } from './flightModels';
import { buildTerrain, lunarHeight } from './lunarTerrain';

const coordinates = { farm: [-8.5, 2.8], control: [0, -4.9], comms: [8.5, 2.8] };
type Point = [number, number];
const habitat: Point = [4.1, -3.4];
const shelterDoor: Point = [0, -2.65];
const farmDoor: Point = [-5.65, 2.4];
const beaconColors = { clear: 0x90d8f0, warning: 0xfcb96e, rising: 0xff8d59, peak: 0xff6964, recovery: 0x94e6a4 };
type BuildingId = Building['id'];

export function mountOutpost(
  container: HTMLElement,
  markers: Record<BuildingId, HTMLButtonElement>,
  activate: (building: Building) => void,
  motion: MotionPreference,
  activateExpansion: (plot: number) => void = () => {},
) {
  const canvas = document.createElement('canvas');
  let renderer: THREE.WebGLRenderer;
  const context = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!context) return mountStaticMap(container, markers);

  try {
    renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  } catch {
    return mountStaticMap(container, markers);
  }

  container.append(canvas);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0910);
  scene.fog = new THREE.FogExp2(0x14141d, .014);
  scene.add(new THREE.HemisphereLight(0xe0e9ff, 0x706055, 2.1));
  const sun = new THREE.DirectionalLight(0xffe3bf, 3.1);
  sun.position.set(-18, 14, -12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, far: 72 });
  sun.shadow.normalBias = .055;
  scene.add(sun);
  buildTerrain(scene);

  const models = buildings.map((building) => {
    const model = makeFacility(building);
    const [x, z] = coordinates[building.id];
    model.group.position.set(x, lunarHeight(x, z), z);
    model.group.userData.building = building;
    model.group.rotation.y = { farm: -.16, control: .10, comms: -.24 }[building.id];
    scene.add(model.group);
    return { building, ...model };
  });

  const expansions = plots.map(([x, z], plot) => {
    const group = new THREE.Group();
    group.userData.plot = plot;
    group.position.set(x, lunarHeight(x, z), z);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, .12, 6), new THREE.MeshStandardMaterial({ color: 0x77808a, wireframe: true }));
    group.add(pad); scene.add(group);
    return { group, signature: '' };
  });
  let timedState: OutpostState | undefined;
  const rover = roverModel(); scene.add(rover.model);
  const caches = cacheIds.map(id => {
    const cache = new THREE.Group();
    const [x,z] = cacheSites[id].point;
    cache.position.set(x,lunarHeight(x,z),z);
    box(cache,[1.65,.21,1.28],[0,.12,0],0x626f78);
    box(cache,[1.22,.7,.8],[0,.47,0],0xc58243);
    for (const rail of [-.41,.41]) box(cache,[.09,.72,.86],[rail,.48,0],0xd9b786);
    box(cache,[.08,1.4,.08],[.6,.79,.3],0xa9a7a0);
    const beacon = box(cache,[.15,.21,.15],[.6,1.55,.3],0x75ffbf,true);
    scene.add(cache);
    return {id,cache,beacon};
  });
  const overlook = new THREE.Group();
  overlook.position.set(locations.heritage[0], lunarHeight(...locations.heritage), locations.heritage[1]);
  box(overlook,[1.4,.15,1.2],[0,.09,0],0x7f9da9);
  box(overlook,[1.2,.78,.13],[0,.63,-.48],0x9cc8d5);
  scene.add(overlook);
  // Scale model beside the interpretive sign, separate from collectible equipment.
  const surveyor = new THREE.Group();
  surveyor.position.set(-21, lunarHeight(-21,9.5), 9.5);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.48,.64,.45,7),
    new THREE.MeshStandardMaterial({ color:0xccc3a6, metalness:.3, roughness:.5 }));
  body.position.y = .62; surveyor.add(body);
  box(surveyor,[.08,.8,.08],[0,1.03,0],0xcbc7b6);
  const panel = box(surveyor,[.64,.06,.64],[0,1.42,0],0x3d6490);
  panel.rotation.z = .26;
  for (let leg = 0; leg < 3; leg++) {
    const base = new THREE.Group(); base.rotation.y = leg * 2 * Math.PI / 3;
    surveyor.add(base);
    const strut = box(base,[.09,.91,.09],[.52,.4,0],0xc6bfa6);
    strut.rotation.z = .65;
    box(base,[.28,.1,.28],[.78,.1,0],0xc4a066);
  }
  scene.add(surveyor);
  const dock = new THREE.Group();
  dock.position.set(locations.dock[0], lunarHeight(...locations.dock), locations.dock[1]);
  box(dock,[2.55,.1,2.6],[0,.02,0],0x596d78);
  for (const x of [-1.19,1.19]) box(dock,[.13,.12,2.55],[x,.09,0],0x8bdab7,true);
  scene.add(dock);
  let driving = false;
  function updateFacilities(state: OutpostState, driveView = false) {
    timedState = state;
    driving = driveView;
    fallback?.updateFacilities(state, driveView);
    phase = stormAt(state.elapsed, state.campaign.safetyChecked);
    sun.position.y = Math.hypot(sun.position.x,sun.position.z) * Math.tan(THREE.MathUtils.degToRad(missionSunElevation(state.elapsed)));
    growLevel = state.growLights === false ? 0 : .65;
    for (const { id, cache } of caches) cache.visible = state.campaign.rover.contacts.includes(id)
      && !state.campaign.rover.collected.includes(id);
    expansions.forEach((site, index) => {
      const facility = state.facilities.find(f => f.plot === index);
      const done = !!facility && facility.progress >= constructionTypes[facility.type].seconds;
      const online = facility?.enabled !== false && (facility?.type !== 'greenhouse' || state.growLights !== false);
      const signature = facility ? `${facility.type}-${done}-${online}` : '';
      if (site.signature === signature) return;
      site.signature = signature;
      if (site.group.children[1]) disposeModel(site.group.children[1]);
      if (facility) site.group.add(expansionModel(facility.type, done, online));
    });
  }

  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x746c64, roughness: 1 });
  const path = new THREE.BufferGeometry();
  const routes = [
    [[-8.5, 2.8], [8.5, 2.8]],
    [[0, 2.30], [0, -4.9]],
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [[ax, az], [bx, bz]] of routes) {
    const length = Math.hypot(bx - ax, bz - az);
    const dx = (bz - az) / length * .49;
    const dz = (ax - bx) / length * .49;
    const start = positions.length / 3;
    const subdivisions = Math.ceil(length * 4);
    for (let index = 0; index <= subdivisions; index++) {
      const ratio = index / subdivisions;
      const x = THREE.MathUtils.lerp(ax, bx, ratio);
      const z = THREE.MathUtils.lerp(az, bz, ratio);
      positions.push(x - dx, lunarHeight(x - dx, z - dz) + .045, z - dz);
      positions.push(x + dx, lunarHeight(x + dx, z + dz) + .045, z + dz);
      const face = start + index * 2;
      if (index < subdivisions) indices.push(face, face + 2, face + 1, face + 1, face + 2, face + 3);
    }
  }
  path.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  path.setIndex(indices);
  path.computeVertexNormals();
  pathMaterial.side = THREE.DoubleSide;
  const roads = new THREE.Mesh(path, pathMaterial);
  roads.receiveShadow = true;
  scene.add(roads);

  const lander = createLander();
  const landingZ = 9.3;
  const landingHeight = lunarHeight(0, landingZ);
  lander.position.set(0, landingHeight, landingZ);
  lander.rotation.y = Math.PI;
  const ramp = new THREE.Mesh(
    new THREE.BoxGeometry(.83, .055, 2.65),
    new THREE.MeshStandardMaterial({ color: 0x81786b, roughness: .8 }),
  );
  ramp.position.set(0, .81, 2.24);
  ramp.rotation.x = .55;
  ramp.castShadow = true;
  lander.add(ramp);
  scene.add(lander);
  const crew = crewRoster.map(member => createAstronaut(member.color));
  const workerLabels = crewRoster.map(member => {
    const name = document.createElement('span');
    name.className = 'worker-map-label';
    name.textContent = member.name.split(' ')[0];
    name.style.color = `#${member.color.toString(16)}`;
    container.append(name);
    return name;
  });
  for (const { figure } of crew) {
    figure.rotation.y = Math.PI;
    figure.visible = false;
    scene.add(figure);
  }

  const residence = new THREE.Group();
  const livingPod = new THREE.Mesh(new THREE.CylinderGeometry(.79, .79, 2.25, 12),
    new THREE.MeshStandardMaterial({ color: 0xbcb8b0, roughness: .6 }));
  livingPod.rotation.z = Math.PI / 2;
  livingPod.position.y = .9;
  livingPod.castShadow = true;
  residence.add(livingPod);
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(.7, .77, .12),
    new THREE.MeshStandardMaterial({ color: 0x7c878d, roughness: .5 }));
  hatch.position.set(0, .57, .76);
  residence.add(hatch);
  residence.position.set(habitat[0], lunarHeight(...habitat), habitat[1] - .93);
  scene.add(residence);

  const crate = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(.44, .16, .32),
    new THREE.MeshStandardMaterial({ color: 0xcb9553 }));
  crate.add(tray);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x9bd670, emissive: 0x20501b, emissiveIntensity: .55 });
  for (const x of [-.135, 0, .135]) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(.092, 0), leafMaterial);
    leaf.position.set(x, .105, 0);
    crate.add(leaf);
  }
  crate.visible = false;
  scene.add(crate);

  const flowGeometry = new THREE.SphereGeometry(.085, 8, 6);
  const supply: Point = [0, 2.55];
  const flows = [shelterDoor, farmDoor].map((target, index) => ({
    target,
    nodes: Array.from({ length: 5 }, () => {
      const node = new THREE.Mesh(flowGeometry, new THREE.MeshBasicMaterial({ color: index ? 0xbaf39d : 0x98eaff }));
      node.visible = false;
      scene.add(node);
      return node;
    }),
  }));
  const powerUnit = new THREE.Mesh(new THREE.BoxGeometry(.95, .42, .65),
    new THREE.MeshStandardMaterial({ color: 0x5f6571, emissive: 0x92c9e7, emissiveIntensity: .21 }));
  powerUnit.position.set(supply[0], lunarHeight(...supply) + .24, supply[1]);
  scene.add(powerUnit);

  const camera = new THREE.PerspectiveCamera(41, 1, .2, 240);
  const look = new THREE.Vector3(0, 1, 0);
  const aim = new THREE.Vector3();
  const anchor = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const targets = models.map((model) => model.group);
  let selected: BuildingId | undefined;
  let hovered: BuildingId | undefined;
  let growLevel = .46;
  let phase: StormPhase = 'clear';
  let committed: MissionState | undefined;
  let action: Extract<MissionEvent, { type: 'day' }> | undefined;
  let actionStart = 0;
  const growth = { off: 0, low: .46, full: 1.65 };
  const crewDoor = (state: MissionState): Point => state.lastPlan.location === 'shelter' ? shelterDoor : habitat;
  let width = 1;
  let height = 1;
  let frame = 0;
  let fallback: ReturnType<typeof mountStaticMap> | undefined;
  let arrivalStart: number | undefined;
  let resolveReady: () => void;
  const ready = new Promise<void>((resolve) => { resolveReady = resolve; });

  function renderArrival(now: number) {
    if (arrivalStart === undefined) return 1;
    const age = now - arrivalStart;
    lander.position.y = landingHeight + (1 - THREE.MathUtils.smoothstep(age, 0, 2100)) * 4.8;
    ramp.visible = age >= 2000;
    const progress = THREE.MathUtils.clamp((age - 2100) / 4300, 0, 1);
    walkCrew([[0, landingZ - 1.1], [0, 3.4], habitat], progress, true);
    return THREE.MathUtils.smoothstep(age, 2400, 6600);
  }

  function walkCrew(route: Point[], progress: number, fromLander = false) {
    const lengths = route.slice(1).map(([x, z], i) => Math.hypot(x - route[i][0], z - route[i][1]));
    const length = lengths.reduce((sum, value) => sum + value, 0);
    for (const [i, { figure, walk }] of crew.entries()) {
      const step = (progress - i * .04) / .83;
      figure.visible = step > 0 && step < 1;
      if (!figure.visible) continue;
      const distance = step * length;
      let remaining = distance;
      let edge = 0;
      while (edge < lengths.length - 1 && remaining > lengths[edge]) remaining -= lengths[edge++];
      const [ax, az] = route[edge];
      const [bx, bz] = route[edge + 1];
      const t = remaining / Math.max(.01, lengths[edge]);
      const x = THREE.MathUtils.lerp(ax, bx, t) + (i - 2) * .28;
      const z = THREE.MathUtils.lerp(az, bz, t);
      let y = lunarHeight(x, z);
      if (fromLander && edge === 0) y = Math.max(y, landingHeight + 1.4 - distance * .59);
      figure.rotation.y = Math.atan2(bx - ax, bz - az);
      figure.position.set(x, y + walk(distance, true), z);
    }
  }

  function clearAction() {
    arrivalStart = undefined;
    action = undefined;
    lander.position.y = landingHeight;
    ramp.visible = true;
    crate.visible = false;
    for (const { figure } of crew) figure.visible = false;
    for (const flow of flows) for (const node of flow.nodes) node.visible = false;
  }

  function renderAction(now: number) {
    if (!action) return;
    const progress = THREE.MathUtils.clamp((now - actionStart) / Math.max(1, action.duration), 0, 1);
    const from = crewDoor(action.previous);
    const to = crewDoor(action.result.next);
    if (action.result.harvest && !hasParticleRisk(action.result.phase)) {
      if (progress < .47) walkCrew([from, farmDoor], progress / .47);
      else {
        walkCrew([farmDoor, [0, 2.3], to], (progress - .5) / .49);
        crate.visible = crew[0].figure.visible;
        crate.position.copy(crew[0].figure.position);
        crate.position.y += .54;
        crate.position.x += .14;
      }
    } else {
      if (from !== to) walkCrew([from, to], progress / .65);
      const outputs = [action.result.airPower, action.result.lightPower];
      for (const [index, { target, nodes }] of flows.entries()) {
        const destination = index === 0 ? to : target;
        for (const [i, node] of nodes.entries()) {
          node.visible = Boolean(outputs[index] && progress > .18 && progress < .9);
          const t = (progress * 2.3 + i / nodes.length) % 1;
          const x = THREE.MathUtils.lerp(supply[0], destination[0], t);
          const z = THREE.MathUtils.lerp(supply[1], destination[1], t);
          node.position.set(x, lunarHeight(x, z) + .28, z);
        }
      }
    }
    if (!hasParticleRisk(action.result.phase) && to === habitat) {
      for (const [index, member] of crewRoster.entries()) {
        const task = action.result.next.lastPlan.assignments[member.id];
        if (task !== 'inspect' && task !== 'repair' && task !== 'grow') continue;
        const actor = crew[index];
        const target: Point = task === 'grow' ? farmDoor : [supply[0] + .9, supply[1] + .9];
        const progressToSite = THREE.MathUtils.smoothstep(progress, .02, .38);
        const x = THREE.MathUtils.lerp(from[0], target[0], progressToSite);
        const z = THREE.MathUtils.lerp(from[1], target[1], progressToSite);
        actor.figure.visible = progress > .02;
        actor.figure.position.set(x, lunarHeight(x, z) + (progress < .38 ? actor.walk(progress * 5, true) : 0), z);
        actor.figure.rotation.y = Math.atan2(target[0] - from[0], target[1] - from[1]);
        if (progress >= .38) actor.work(progress, task);
      }
    }
    if (progress > .3) growLevel = growth[action.result.next.lastPlan.lights];
  }

  function present(event: MissionEvent) {
    fallback?.present(event);
    switch (event.type) {
      case 'arrival':
        if (!fallback && !motion.reduced) arrivalStart = performance.now();
        break;
      case 'warning':
        clearAction();
        phase = 'warning';
        break;
      case 'day':
        clearAction();
        committed = event.result.next;
        phase = event.result.phase;
        if (event.duration && !fallback) {
          action = event;
          actionStart = performance.now();
        } else growLevel = growth[committed.lastPlan.lights];
        break;
      case 'settled':
      case 'reset':
      case 'debrief':
        clearAction();
        committed = event.state;
        phase = event.phase;
        growLevel = growth[committed.lastPlan.lights];
        break;
    }
  }

  function pick(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(targets, true).find(({ object }) => object.visible);
    let item = hit?.object as THREE.Object3D | undefined;
    while (item && !item.userData.building) item = item.parent ?? undefined;
    return item?.userData.building as Building | undefined;
  }

  canvas.addEventListener('pointermove', (event) => {
    hovered = pick(event)?.id;
    canvas.style.cursor = hovered ? 'pointer' : '';
  });
  canvas.addEventListener('pointerleave', () => { hovered = undefined; });
  canvas.addEventListener('click', (event) => {
    const building = pick(event);
    if (building) activate(building);
    else {
      const hit = raycaster.intersectObjects(expansions.map(site => site.group), true)[0];
      let item = hit?.object as THREE.Object3D | undefined;
      while (item && item.userData.plot === undefined) item = item.parent ?? undefined;
      if (item) activateExpansion(item.userData.plot);
    }
  });

  function resize() {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height, false);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  const start = performance.now();
  const roverCamera = new THREE.Vector3();
  const roverLook = new THREE.Vector3();
  const strutTop = new THREE.Vector3(), strutEnd = new THREE.Vector3(), strutDirection = new THREE.Vector3();
  const forwardAxis = new THREE.Vector3(0,0,1);
  let chaseStarted = false;
  let previousRender = start;

  function render(now: number) {
    const dt = Math.min(.1, (now - previousRender) / 1000);
    previousRender = now;
    const moving = !motion.reduced;
    const time = moving ? (now - start) / 1000 : 0;
    const compact = width < 760;
    const distance = Math.max(.92, (compact ? 1.09 : .94) / camera.aspect);
    const arrivalBlend = renderArrival(now);
    renderAction(now);
    if (timedState) {
      const { campaign } = timedState;
      const [x,z] = campaign.rover.position;
      const { heading, velocity, steering } = campaign.rover;
      const blend = moving ? 1-Math.exp(-dt*14) : 1;
      const old = rover.model.position.distanceTo(anchor.set(x,lunarHeight(x,z),z));
      rover.model.position.lerp(anchor, old > 8 ? 1 : blend);
      const angle = heading - rover.model.rotation.y;
      rover.model.rotation.y += Math.atan2(Math.sin(angle),Math.cos(angle)) * blend;
      const cosine = Math.cos(rover.model.rotation.y), sine = Math.sin(rover.model.rotation.y);
      const heights = rover.wheels.map(({ x:wx, z:wz }) =>
        lunarHeight(rover.model.position.x + wx*cosine + wz*sine, rover.model.position.z - wx*sine + wz*cosine));
      const average = heights.reduce((sum,value) => sum+value,0)/4;
      const [backLeft,frontLeft,backRight,frontRight] = heights;
      rover.body.position.y = average-rover.model.position.y;
      rover.body.rotation.x = Math.atan2(backLeft+backRight-frontLeft-frontRight,3.04);
      rover.body.rotation.z = Math.atan2(frontRight+backRight-frontLeft-backLeft,3.16) - steering * velocity * .013;
      rover.body.updateMatrix();
      rover.wheels.forEach(({ x:wx,z:wz,knuckle,roll,strut }, index) => {
        knuckle.position.y = heights[index] - rover.model.position.y + .36;
        knuckle.rotation.y = wz > 0 ? steering*.46 : 0;
        if (moving) roll.rotation.x += velocity * dt / .36;
        strutTop.set(wx*.54,.55,wz).applyMatrix4(rover.body.matrix);
        strutEnd.copy(knuckle.position);
        strutDirection.subVectors(strutEnd,strutTop);
        strut.position.copy(strutTop).lerp(strutEnd,.5);
        strut.scale.z = strutDirection.length();
        strut.quaternion.setFromUnitVectors(forwardAxis,strutDirection.normalize());
      });
      for (const { beacon } of caches) beacon.scale.y = moving ? 1 + .22*Math.sin(time*4) : 1;
      if (arrivalBlend === 1) crew.forEach(({ figure, walk, work, sit }, i) => {
        const member = crewRoster[i];
        const point = campaign.workers[member.id].position;
        const status = workerStatus(campaign, member.id, timedState!.sheltered, nextBuild(timedState!)?.plot);
        if (campaign.rover.driver === member.id) {
          figure.visible = true;
          figure.position.copy(rover.model.position); figure.position.y += .71 + rover.body.position.y;
          figure.rotation.y = campaign.rover.heading;
          sit();
          return;
        }
        figure.visible = status !== 'In shelter';
        if (!figure.visible) return;
        const dx = point[0]-figure.position.x, dz = point[1]-figure.position.z;
        const walking = Math.hypot(dx,dz) > .08;
        const stride = moving && walking ? walk(time * 1.9,true) : walk(0,false);
        if (walking) figure.rotation.y = Math.atan2(dx,dz);
        figure.position.lerp(anchor.set(point[0],lunarHeight(...point) + stride,point[1]), moving ? .15 : 1);
        if (moving && !walking && status.startsWith('Working')) work(time * .45, member.id === 'imani' ? 'grow' : 'repair');
      });
    }
    const focus = models.find(({ building }) => building.id === selected);
    aim.set(
      focus && !compact ? focus.group.position.x * .12 : 0,
      compact ? .9 : 1.2,
      (1 - arrivalBlend) * 4.7,
    );
    look.lerp(aim, moving ? .075 : 1);
    camera.position.set(
      look.x + (compact ? 1.1 : 2.5) * distance + Math.sin(time * .45) * .24,
      THREE.MathUtils.lerp(11, 20, arrivalBlend) * distance + (moving ? Math.exp(-time * 2) * 2.6 : 0),
      look.z + THREE.MathUtils.lerp(19, 28, arrivalBlend) * distance,
    );
    if (driving && timedState) {
      const heading = rover.model.rotation.y;
      const { x, y, z } = rover.model.position;
      const cameraBlend = !chaseStarted || !moving ? 1 : 1-Math.exp(-dt*5.5);
      roverCamera.lerp(anchor.set(x - Math.sin(heading)*7, y+4.4, z - Math.cos(heading)*7),cameraBlend);
      roverLook.lerp(anchor.set(x + Math.sin(heading)*3,y+.7,z + Math.cos(heading)*3),cameraBlend);
      camera.position.copy(roverCamera);
      look.copy(roverLook);
      chaseStarted = true;
    } else chaseStarted = false;
    camera.lookAt(look);
    camera.updateMatrixWorld();

    for (const { building, group, ring, beacon, grow, dishPivot, markerHeight } of models) {
      ring.visible = selected === building.id || hovered === building.id;
      if (building.id === 'control') {
        beacon.color.set(beaconColors[phase]);
        beacon.emissive.copy(beacon.color);
        beacon.emissiveIntensity = phase === 'clear' ? .55 : 1.23 + .37 * Math.sin(time * (phase === 'peak' ? 4 : 2.4));
        if (committed?.lastPlan.location === 'shelter') ring.visible = true;
      } else beacon.emissiveIntensity = .54 + .19 * Math.sin(time * 2.1);
      grow.emissiveIntensity += (growLevel - grow.emissiveIntensity) * (moving ? .11 : 1);
      dishPivot.rotation.y = Math.sin(time * .37) * .74 + .35;
      anchor.copy(group.position);
      anchor.y += markerHeight;
      anchor.project(camera);
      markers[building.id].style.setProperty('--marker-x', `${(anchor.x * .5 + .5) * 100}%`);
      markers[building.id].style.top = `${(.5 - anchor.y * .5) * 100}%`;
    }

    crew.forEach(({ figure }, i) => {
      const label = workerLabels[i];
      label.hidden = !timedState || !figure.visible || driving || timedState.campaign.rover.driver === crewRoster[i].id;
      if (label.hidden) return;
      anchor.copy(figure.position); anchor.y += 1.3; anchor.project(camera);
      label.hidden = Math.abs(anchor.x) > .97 || Math.abs(anchor.y) > .97;
      label.style.left = `${(anchor.x*.5+.5)*100}%`;
      label.style.top = `${(.5-anchor.y*.5)*100}%`;
    });
    renderer.render(scene, camera);
    resolveReady();
    frame = requestAnimationFrame(render);
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.remove();
    workerLabels.forEach(label => label.remove());
    fallback = mountStaticMap(container, markers);
    fallback.select(selected);
    if (timedState) fallback.updateFacilities(timedState, driving);
    if (committed) fallback.present({ type: 'settled', state: committed, phase });
    resolveReady();
  }, { once: true });

  frame = requestAnimationFrame(render);
  return {
    ready,
    updateFacilities,
    select(id?: BuildingId) {
      selected = id;
      fallback?.select(id);
    },
    present,
  };
}

function mountStaticMap(container: HTMLElement, markers: Record<BuildingId, HTMLButtonElement>) {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 600;
  container.classList.add('static-map');
  container.append(canvas);
  const context = canvas.getContext('2d');
  const sites = { farm: [257, 344], control: [480, 230], comms: [703, 344] };
  for (const building of buildings) {
    const [x, y] = sites[building.id];
    markers[building.id].style.setProperty('--marker-x', `${x / 9.6}%`);
    markers[building.id].style.top = `${(y - 39) / 6}%`;
  }
  let expansionState: OutpostState | undefined;
  let selected: BuildingId | undefined;
  let phase: StormPhase = 'clear';
  let state: MissionState | undefined;
  function paint() {
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#302f39');
    gradient.addColorStop(1, '#65605a');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 960, 600);
    for (const [x, y, radius] of [[110, 125, 72], [790, 140, 78], [460, 490, 112], [137, 474, 54], [844, 464, 57]]) {
      context.beginPath();
      context.ellipse(x, y, radius, radius * .57, 0, 0, Math.PI * 2);
      context.fillStyle = '#33313a';
      context.fill();
      context.strokeStyle = '#81796e';
      context.lineWidth = 3;
      context.stroke();
    }
    context.beginPath();
    context.moveTo(...sites.farm as [number, number]);
    context.lineTo(...sites.control as [number, number]);
    context.lineTo(...sites.comms as [number, number]);
    context.lineWidth = 11;
    context.strokeStyle = '#81786d';
    context.stroke();
    if (expansionState) {
      const { rover, workers } = expansionState.campaign;
      const mapPoint = ([x,z]: readonly [number,number]) => [480 + x*8, 300 + z*6] as const;
      const mark = (point: readonly [number,number], label: string, color: string) => {
        const [x,y] = mapPoint(point);
        context.fillStyle = color; context.fillRect(x-3,y-3,6,6);
        context.font = '13px sans-serif'; context.fillText(label,x+6,y+4);
      };
      mark(locations.dock,'Dock','#9deabc');
      mark(locations.heritage,'Apollo 12 overlook','#9adef2');
      for (const id of rover.contacts) if (!rover.collected.includes(id)) mark(cacheSites[id].point,cacheSites[id].name,'#ffd19c');
      mark(rover.position,'Rover','#ffd19c');
      if (expansionState.sheltered) mark(shelter,'Shelter','#9deabc');
      crewRoster.forEach(member => {
        const point = workers[member.id].position;
        if (rover.driver !== member.id && (!expansionState?.sheltered || point[0] !== shelter[0] || point[1] !== shelter[1])) mark(point,member.name.split(' ')[0],`#${member.color.toString(16)}`);
      });
    }
    if (expansionState) for (const facility of expansionState.facilities) {
      const [px, pz] = plots[facility.plot];
      const x = 480 + px * 24, y = 300 + pz * 16;
      context.strokeStyle = '#ffc580'; context.strokeRect(x - 22, y - 15, 44, 30);
      context.fillStyle = '#ffffff'; context.font = '12px sans-serif';
      context.fillText(`${constructionTypes[facility.type].name} ${Math.round(facility.progress / constructionTypes[facility.type].seconds * 100)}%`, x - 40, y - 20);
    }
    for (const building of buildings) {
      const [x, y] = sites[building.id];
      context.fillStyle = '#292c31';
      context.fillRect(x - 49, y - 13, 98, 49);
      const color = building.id === 'control' && phase !== 'clear' ? beaconColors[phase]
        : building.id === 'farm' && state?.lastPlan.lights === 'off' ? 0x6e7959 : building.color;
      context.fillStyle = `#${color.toString(16)}`;
      context.fillRect(x - 41, y - 7, 82, 25);
      if (building.id === selected) {
        context.lineWidth = 3;
        context.strokeStyle = context.fillStyle;
        context.strokeRect(x - 55, y - 19, 110, 61);
      }
    }
  }
  paint();
  return {
    ready: Promise.resolve(),
    updateFacilities(state: OutpostState, _driving = false) { expansionState = state; phase = stormAt(state.elapsed, state.campaign.safetyChecked); paint(); },
    select(id?: BuildingId) { selected = id; paint(); },
    present(event: MissionEvent) {
      if ('state' in event) { state = event.state; phase = event.phase; }
      if (event.type === 'day') { state = event.result.next; phase = event.result.phase; }
      if (event.type === 'warning') phase = 'warning';
      paint();
    },
  };
}
