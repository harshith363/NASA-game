import * as THREE from 'three';

const ceramic = new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: .64 });
const alloy = new THREE.MeshStandardMaterial({ color: 0x555961, metalness: .46, roughness: .48 });
const amber = new THREE.MeshStandardMaterial({ color: 0xcb9448, metalness: .28, roughness: .55 });
const visor = new THREE.MeshStandardMaterial({ color: 0x263b49, metalness: .48, roughness: .16 });
const suit = new THREE.MeshStandardMaterial({ color: 0xe5e0ce, roughness: .92 });

function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
  const part = new THREE.Mesh(geometry, material);
  part.position.set(x, y, z);
  part.castShadow = true;
  parent.add(part);
  return part;
}

export function createLander() {
  const craft = new THREE.Group();
  mesh(craft, new THREE.CylinderGeometry(.94, 1.53, 1.64, 8), ceramic, 0, 2.08, 0);
  mesh(craft, new THREE.CylinderGeometry(1.53, 1.48, .23, 8), amber, 0, 1.18, 0);
  mesh(craft, new THREE.CylinderGeometry(.6, .48, .52, 12, 1, true), alloy, 0, .91, 0);
  mesh(craft, new THREE.CylinderGeometry(.48, .92, .47, 8), ceramic, 0, 3.1, 0);
  mesh(craft, new THREE.BoxGeometry(.88, .93, .2), alloy, 0, 2.03, 1.31);
  for (const x of [-.41, .41]) {
    const window = mesh(craft, new THREE.BoxGeometry(.48, .39, .12), visor, x, 2.46, 1.12);
    window.rotation.y = x > 0 ? .28 : -.28;
  }
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      const leg = mesh(craft, new THREE.CylinderGeometry(.081, .11, 1.62, 8), alloy, x * 1.5, .78, z * 1.04);
      leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-x * .6, 1, -z * .4).normalize());
      mesh(craft, new THREE.CylinderGeometry(.27, .32, .12, 10), amber, x * 1.92, .09, z * 1.31);
    }
  }
  return craft;
}

const torsoGeometry = new THREE.CapsuleGeometry(.17, .21, 4, 8);
const packGeometry = new THREE.BoxGeometry(.25, .33, .15);
const helmetGeometry = new THREE.SphereGeometry(.157, 12, 8);
const glassGeometry = new THREE.SphereGeometry(.121, 12, 8);
const armGeometry = new THREE.CapsuleGeometry(.046, .16, 3, 7);
const legGeometry = new THREE.CapsuleGeometry(.061, .2, 3, 7);
const bootGeometry = new THREE.BoxGeometry(.124, .085, .165);
const patchGeometry = new THREE.BoxGeometry(.14, .07, .04);
const toolGeometry = new THREE.BoxGeometry(.07, .19, .09);

export function createAstronaut(color: number) {
  const accent = new THREE.MeshStandardMaterial({ color, roughness: .56 });
  const figure = new THREE.Group();
  mesh(figure, torsoGeometry, suit, 0, .51, 0);
  mesh(figure, packGeometry, alloy, 0, .52, -.14);
  mesh(figure, helmetGeometry, suit, 0, .85, 0);
  const glass = mesh(figure, glassGeometry, visor, 0, .86, .091);
  glass.scale.set(1, .79, .63);
  mesh(figure, patchGeometry, accent, 0, .57, .16);
  const limbs: { arm: THREE.Group; leg: THREE.Group; side: number }[] = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * .181, .61, 0);
    figure.add(arm);
    mesh(arm, armGeometry, suit, 0, -.115, 0);
    const leg = new THREE.Group();
    leg.position.set(side * .082, .34, 0);
    figure.add(leg);
    mesh(leg, legGeometry, suit, 0, -.139, 0);
    mesh(leg, bootGeometry, accent, 0, -.275, .025);
    limbs.push({ arm, leg, side });
  }

  const hand = limbs[1].arm;
  const tool = mesh(hand, toolGeometry, accent, 0, -.245, .06);
  tool.visible = false;
  return {
    figure,
    sit() {
      tool.visible = false;
      for (const { arm, leg } of limbs) {
        arm.rotation.set(-.65, 0, 0);
        leg.rotation.x = -1.3;
      }
    },
    work(progress: number, task: 'inspect' | 'repair' | 'grow') {
      const cycle = progress * Math.PI * 8;
      tool.visible = true;
      hand.rotation.x = task === 'repair' ? -.9 + .44 * Math.sin(cycle) : -1.15 + .1 * Math.sin(cycle);
      hand.rotation.z = task === 'grow' ? .28 + .19 * Math.sin(cycle) : 0;
      limbs[0].arm.rotation.x = -.28;
      for (const { leg } of limbs) leg.rotation.x = 0;
    },
    walk(distance: number, moving: boolean) {
      tool.visible = false;
      hand.rotation.z = 0;
      const stride = moving ? Math.sin(distance * 7) * .42 : 0;
      for (const { arm, leg, side } of limbs) {
        arm.rotation.x = stride * side;
        leg.rotation.x = -stride * side;
      }
      return moving ? Math.abs(Math.sin(distance * 7)) * .05 : 0;
    },
  };
}
