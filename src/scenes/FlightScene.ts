import * as THREE from 'three';
import { flightBeats, type FlightPresentation } from '../mission/flightPresentation';

export function mountFlightScene(host: HTMLElement) {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch {
    host.textContent = 'Exterior camera unavailable. Follow the spacecraft on the trajectory display.';
    return { update: (_: FlightPresentation) => {}, dispose: () => {} };
  }
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, .1, 1400);
  const sunlight = new THREE.DirectionalLight(0xffe1bc, 3.1);
  sunlight.position.set(-20, 30, 17);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -16, right: 16, top: 18, bottom: -14, far: 85 });
  sunlight.shadow.camera.updateProjectionMatrix();
  sunlight.shadow.bias = -.0008;
  scene.add(sunlight, new THREE.HemisphereLight(0xb3dbff, 0x413e45, 1.6));
  const material = (color: number, metalness = .05) => new THREE.MeshStandardMaterial({ color, metalness, roughness: .62 });
  const materials = {
    white: material(0xf5f0e7), black: material(0x20252a), steel: material(0x99a2aa, .5),
    copper: material(0xc77841), tower: material(0x53606b), gold: material(0xbb9a52, .5),
    ocean: material(0x2275bd), land: material(0x668a67), lunar: material(0x93908c),
    pad: material(0x454c53), glass: material(0x183745, .34), solar: material(0x243d7c, .25),
  };
  function part(parent: THREE.Object3D, geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function barrel(parent: THREE.Object3D, top: number, bottom: number, height: number, mat: THREE.Material, x: number, y: number, z = 0) {
    return part(parent, new THREE.CylinderGeometry(top, bottom, height, 32), mat, x, y, z);
  }
  function box(parent: THREE.Object3D, w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) {
    return part(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  }
  const rocket = new THREE.Group();
  const core = new THREE.Group();
  rocket.add(core);
  scene.add(rocket);
  barrel(core, 1.03, 1.03, 9, materials.copper, 0, 6);
  for (let i = 0; i < 18; i++) {
    const a = i * Math.PI / 9;
    const seam = box(core, .044, 8.5, .044, materials.copper, Math.cos(a) * 1.035, 6, Math.sin(a) * 1.035);
    seam.rotation.y = -a;
  }
  barrel(core, 1.04, 1.04, .32, materials.steel, 0, 1.6);
  barrel(core, 1.04, 1.04, .18, materials.white, 0, 10.4);
  barrel(core, .83, 1.03, 1.2, materials.white, 0, 11);
  barrel(core, .83, .83, 2.05, materials.white, 0, 12.57);
  barrel(core, .84, .84, .21, materials.black, 0, 12.1);
  barrel(core, .28, .84, 1.3, materials.white, 0, 14.24);
  barrel(core, .09, .09, 1.05, materials.steel, 0, 15.35);
  barrel(core, 0, .16, .6, materials.white, 0, 16.12);
  for (const x of [-.41, .41]) for (const z of [-.39, .39]) barrel(core, .15, .32, .74, materials.black, x, 1.07, z);
  const boosters = [-1, 1].map(side => {
    const group = new THREE.Group();
    rocket.add(group);
    barrel(group, .46, .46, 8.5, materials.white, 0, 4.85);
    barrel(group, .05, .46, 1.25, materials.white, 0, 9.73);
    for (const y of [1.2, 3.2, 5.5, 7.8]) barrel(group, .47, .47, .16, materials.black, 0, y);
    barrel(group, .28, .48, .61, materials.steel, 0, .42);
    return { side, group };
  });
  const flame = new THREE.Group();
  rocket.add(flame);
  const hot = new THREE.MeshBasicMaterial({ color: 0xffedc5 });
  const cool = new THREE.MeshBasicMaterial({ color: 0xff862e, transparent: true, opacity: .58, depthWrite: false });
  for (const x of [-1.55, 0, 1.55]) {
    barrel(flame, .43, .03, 4.1, cool, x, -1.65);
    barrel(flame, .29, .02, 2.5, hot, x, -.88);
  }
  const exhaustGeometry = new THREE.BufferGeometry();
  const exhaust = new Float32Array(180 * 3);
  exhaustGeometry.setAttribute('position', new THREE.BufferAttribute(exhaust, 3));
  const exhaustMaterial = new THREE.PointsMaterial({ color: 0xffc989, size: .16, transparent: true, opacity: .72, depthWrite: false });
  const exhaustCloud = new THREE.Points(exhaustGeometry, exhaustMaterial);
  exhaustCloud.frustumCulled = false;
  rocket.add(exhaustCloud);

  const complex = new THREE.Group();
  scene.add(complex);
  box(complex, 150, .3, 120, materials.land, 0, -.98, 0).receiveShadow = true;
  box(complex, 22, .7, 17, materials.pad, 0, -.5, 0).receiveShadow = true;
  box(complex, 8, .05, 50, materials.pad, 24, -.79, -24);
  for (let i = 0; i < 8; i++) box(complex, .1, .06, 2.5, materials.white, 24, -.76, -i * 5);
  for (const side of [-1, 1]) box(complex, .12, .03, 15, materials.gold, side * 9.75, -.13, 0);
  for (const x of [-6.1, -3.4]) for (const z of [-1.3, 1.3]) box(complex, .24, 15, .24, materials.steel, x, 7.3, z);
  for (let level = 0; level < 7; level++) {
    const y = level * 2.08;
    box(complex, 3.3, .14, 3.1, materials.tower, -4.75, y, 0);
    for (const z of [-1.3, 1.3]) {
      const beam = box(complex, .13, 3.3, .13, materials.steel, -4.75, y + 1, z);
      beam.rotation.z = level % 2 ? .9 : -.9;
    }
  }
  for (const y of [5.7, 10.9, 13.3]) box(complex, 2.3, .22, .42, materials.tower, -2.3, y, -.45);

  for (const model of [rocket, complex]) model.traverse(node => {
    if (node instanceof THREE.Mesh && node.geometry.type !== 'BoxGeometry') node.castShadow = true;
    if (node instanceof THREE.Mesh && node.material === materials.steel) node.castShadow = true;
  });

  const capsule = new THREE.Group();
  scene.add(capsule);
  barrel(capsule, .46, 1.48, 1.95, materials.white, 0, .8);
  barrel(capsule, 1.5, 1.46, .19, materials.black, 0, -.26);
  barrel(capsule, 1.38, 1.26, 1.4, materials.steel, 0, -1.1);
  barrel(capsule, .38, .62, .65, materials.black, 0, -2.1);
  box(capsule, .5, .29, .11, materials.glass, .45, 1, 1.03);
  box(capsule, .5, .29, .11, materials.glass, -.45, 1, 1.03);
  for (const side of [-1, 1]) {
    box(capsule, 3, .085, 1.6, materials.solar, side * 3, -.8, 0);
    for (let i = 0; i < 6; i++) box(capsule, .025, .105, 1.58, materials.steel, side * (1.55 + i * .49), -.8, 0);
  }
  const ocean = new THREE.Group();
  scene.add(ocean);
  ocean.visible = false;
  box(ocean, 300, .1, 300, materials.ocean, 0, -1.35, 0);
  const chutes = new THREE.Group();
  scene.add(chutes);
  chutes.visible = false;
  for (const x of [-1.6, 1.6]) {
    const fabric = part(chutes, new THREE.SphereGeometry(1.5, 24, 12, 0, Math.PI*2, 0, Math.PI/2), materials.copper, x, 5.5, 0);
    fabric.scale.y = .65;
    for (const offset of [-1.15, 1.15]) {
      const top = new THREE.Vector3(x + offset, 5.57, 0);
      const bottom = new THREE.Vector3(0, 1.5, 0);
      const line = top.clone().sub(bottom);
      const cord = barrel(chutes, .018, .018, line.length(), materials.white, 0, 0);
      cord.position.copy(top).lerp(bottom, .5);
      cord.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), line.normalize());
    }
  }
  const lander = new THREE.Group();
  scene.add(lander);
  barrel(lander, .93, 1.3, 1.6, materials.white, 0, 1.7);
  barrel(lander, 1.45, 1.45, .65, materials.gold, 0, .7);
  box(lander, .9, .39, .16, materials.glass, 0, 1.9, 1.18);
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    const leg = barrel(lander, .065, .085, 1.6, materials.steel, x * 1.53, .57, z * .91);
    leg.rotation.z = x * .55;
    barrel(lander, .25, .28, .12, materials.gold, x * 1.93, -.12, z * .91);
  }
  const surface = new THREE.Group();
  scene.add(surface);
  barrel(surface, 44, 44, .25, materials.lunar, 0, -.31);
  for (let i = 0; i < 24; i++) {
    const a = i * 2.4, d = 3 + i * 1.7;
    part(surface, new THREE.DodecahedronGeometry(.2 + (i % 4) * .16), materials.lunar, Math.cos(a) * d, .03, Math.sin(a) * d);
  }
  const earth = part(scene, new THREE.SphereGeometry(24, 48, 32), materials.ocean, -23, -19, -55);
  const moon = part(scene, new THREE.SphereGeometry(9, 36, 24), materials.lunar, 21, 10, -58);
  const atmosphere = new THREE.MeshBasicMaterial({ color: 0x70b6ef, transparent: true, opacity: .13, side: THREE.BackSide });
  part(earth, new THREE.SphereGeometry(24.7, 48, 32), atmosphere, 0, 0, 0);
  const stars = new Float32Array(280 * 3);
  for (let i = 0; i < 280; i++) {
    const a = i * 2.39996, y = 1 - i / 140, r = 520 * Math.sqrt(1 - y * y);
    stars.set([Math.cos(a) * r, 520 * y, Math.sin(a) * r], i * 3);
  }
  const starGeometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(stars, 3));
  const starField = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xc3d7ff, size: 1, sizeAttenuation: false }));
  scene.add(starField);
  const sky = new THREE.Color(0x7294af), space = new THREE.Color(0x030912), backdrop = new THREE.Color();
  scene.background = backdrop;
  const target = new THREE.Vector3(), eye = new THREE.Vector3(), offset = new THREE.Vector3();
  let state: FlightPresentation = { phase: 'briefing', reduced: false, paused: false, elapsed: 0 };
  let frame = 0, needsFrame = true, disposed = false;
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    needsFrame = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  function draw() {
    if (disposed) return;
    frame = requestAnimationFrame(draw);
    if (!needsFrame) return;
    needsFrame = false;
    const { phase, elapsed, reduced, returnStage } = state;
    const time = reduced ? 0 : elapsed;
    const beat = flightBeats[phase];
    const progress = beat ? Math.min(time / beat.seconds, 1) : 0;
    const ascent = phase === 'ascent';
    const launch = ['briefing', 'startup', 'clearance', 'countdown', 'ascent'].includes(phase);
    const lunar = ['touchdown', 'debrief', 'outpost'].includes(phase);
    const separation = THREE.MathUtils.smoothstep(progress, .46, .84);
    const skyBlend = ascent ? THREE.MathUtils.smoothstep(progress, .21, .65) : launch ? 0 : 1;
    backdrop.copy(sky).lerp(space, skyBlend);
    complex.visible = launch && progress < .47;
    sunlight.castShadow = complex.visible && progress < .25;
    rocket.visible = launch;
    rocket.position.y = ascent ? 115 * progress ** 1.65 : 0;
    rocket.rotation.z = -separation * .32;
    for (const { side, group } of boosters) group.position.set(side * (1.55 + separation * 9), -separation * 14, -separation * 2);
    flame.visible = ascent && !reduced && progress < .88;
    flame.scale.y = .88 + .18 * Math.sin(time * 35);
    exhaustCloud.visible = flame.visible;
    if (flame.visible) {
      for (let i = 0; i < 180; i++) {
        const age = (time * .7 + i / 180) % 1;
        const a = i * 2.4;
        exhaust[i * 3] = Math.cos(a) * age * 2;
        exhaust[i * 3 + 1] = -age * 12;
        exhaust[i * 3 + 2] = Math.sin(a) * age * 2;
      }
      exhaustGeometry.attributes.position.needsUpdate = true;
    }
    starField.visible = skyBlend > .65;
    earth.visible = skyBlend > .52 && !lunar;
    moon.visible = !launch && !lunar;
    moon.scale.setScalar(phase === 'descent' || phase === 'lunarOrbit' ? 2.15 : 1);
    capsule.visible = !launch && !lunar;
    capsule.rotation.set(.18, .4 + Math.sin(time * .26) * .25, -.55 - progress * .3);
    lander.visible = lunar;
    surface.visible = lunar;
    lander.position.y = phase === 'touchdown' && !reduced ? (1 - progress) ** 2 * 6.5 : 0;
    // A distance floor derived from both axes keeps the vehicle framed at narrow widths.
    const halfHeight = launch ? 10.2 : lunar ? 4.9 : 4.4;
    const halfWidth = launch ? 8 : lunar ? 4.1 : 5.2;
    const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(halfHeight, halfWidth / camera.aspect) / vertical;
    if (launch) target.set(-1.4 + progress * 1.4, rocket.position.y + 8, 0);
    else target.set(0, lunar ? lander.position.y * .65 + 1.4 : -.1, 0);
    offset.set(launch ? .47 - progress * .19 : lunar ? .68 : .42, launch ? .12 : .29, 1).setLength(distance);
    eye.copy(target).add(offset);
    camera.position.copy(eye);
    if (returnStage !== undefined) {
      const landed = returnStage === 0;
      const orbit = returnStage === 1;
      const overWater = returnStage >= 4;
      const recovered = returnStage === 5;
      const approach = returnStage === 2 || returnStage === 3;
      const eased = reduced ? 1 : THREE.MathUtils.smoothstep(time, 0, 2.2);
      backdrop.copy(overWater ? sky : space);
      starField.visible = !overWater;
      rocket.visible = complex.visible = false;
      lander.visible = landed;
      lander.position.y = 0;
      surface.visible = landed;
      earth.visible = approach;
      earth.scale.setScalar(1.65);
      moon.visible = orbit;
      capsule.visible = !landed;
      capsule.children.forEach((part, index) => { if (index === 2 || index === 3 || index >= 6) part.visible = !approach && !overWater; });
      capsule.position.set(0, overWater ? (recovered ? (1-eased)*4-.25 : (1-eased)*3+1.4) : orbit ? eased : 0, 0);
      capsule.rotation.set(.13, .34 + (reduced ? 0 : Math.sin(time * .35) * .12), approach ? 1.9 : overWater ? Math.sin(time * 1.7) * .08 : -.3);
      if (!reduced && orbit) capsule.position.y += Math.sin(time * 1.2) * .12;
      if (!reduced && approach) earth.rotation.y = time * .035;
      ocean.visible = overWater;
      chutes.visible = returnStage === 4;
      chutes.position.y = capsule.position.y;
      chutes.rotation.z = reduced ? 0 : Math.sin(time * 1.7) * .08;
      target.set(0, landed ? 1.2 : chutes.visible ? capsule.position.y + 2 : capsule.position.y, 0);
      const framing = Math.max(chutes.visible ? 5.3 : 3.3, 5.5 / camera.aspect);
      eye.set(4, 2, 10).setLength(framing / vertical).add(target);
      camera.position.copy(eye);
    }
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    const usedMaterials = new Set<THREE.Material>();
    scene.traverse(node => {
      if (node instanceof THREE.Mesh || node instanceof THREE.Points) {
        node.geometry.dispose();
        usedMaterials.add(node.material);
      }
    });
    usedMaterials.forEach(mat => mat.dispose());
    sunlight.shadow.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    dispose();
    host.textContent = 'Exterior camera unavailable. Follow the spacecraft on the trajectory display.';
  }, { once: true });
  frame = requestAnimationFrame(draw);
  return {
    update(next: FlightPresentation) {
      if (next.phase !== state.phase || next.returnStage !== state.returnStage || next.reduced !== state.reduced || (!next.paused && !next.reduced && next.elapsed !== state.elapsed)) needsFrame = true;
      state = next;
    },
    dispose,
  };
}
