import * as THREE from 'three';
import { createLander } from './flightModels';

export function playApproach(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('webgl2', { alpha: false });
  if (!context) return;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  } catch {
    return;
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b14);
  const camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, .1, 320);
  camera.position.set(0, 3.3, 16);
  camera.lookAt(0, 1.3, 0);
  const craft = createLander();
  craft.rotation.set(.13, -.5, -.63);
  craft.position.set(.5, -.2, 0);
  scene.add(craft, new THREE.HemisphereLight(0xf2f5ff, 0x737187, 2.2));

  const key = new THREE.DirectionalLight(0xffdaa9, 3.9);
  key.position.set(-4, 7, 3);
  scene.add(key);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(46, 48, 32), new THREE.MeshStandardMaterial({ color: 0x7f838b }));
  moon.position.set(28, -50, -64);
  scene.add(moon);

  const starCoordinates = new Float32Array(240 * 3);
  for (let offset = 0; offset < starCoordinates.length; offset += 3) {
    starCoordinates[offset] = (Math.random() - .5) * 150;
    starCoordinates[offset + 1] = (Math.random() - .5) * 85;
    starCoordinates[offset + 2] = -6 - Math.random() * 100;
  }
  const stars = new THREE.BufferGeometry();
  stars.setAttribute('position', new THREE.BufferAttribute(starCoordinates, 3));
  scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xdce6ff, size: .13 })));

  const start = performance.now();
  renderer.setAnimationLoop((now) => {
    const time = (now - start) / 1000;
    craft.rotation.y = -.5 + .26 * Math.sin(time * 1.2);
    craft.position.y = Math.sin(time * 1.7) * .16 - .2;
    for (let offset = 2; offset < starCoordinates.length; offset += 3) {
      const starIndex = (offset - 2) / 3;
      starCoordinates[offset] = -6 - ((starIndex * 37.71 + 10000 - time * 22) % 100);
    }
    stars.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  });

  const resize = new ResizeObserver(() => {
    camera.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  });
  resize.observe(canvas);

  return () => {
    resize.disconnect();
    renderer.setAnimationLoop(null);
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) object.geometry.dispose();
    });
    moon.material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
