import * as THREE from 'three';
import type { Building } from '../data/buildings';

type Position = [number, number, number];
const steel = new THREE.MeshStandardMaterial({ color: 0xc9c6ba, roughness: .52, metalness: .22 });
const dark = new THREE.MeshStandardMaterial({ color: 0x33393e, roughness: .75 });
const gold = new THREE.MeshStandardMaterial({ color: 0xc79044, roughness: .5, metalness: .36 });
const glass = new THREE.MeshStandardMaterial({ color: 0x35646d, roughness: .22, metalness: .34 });
const footing = new THREE.MeshStandardMaterial({ color: 0x4e4e4a, roughness: .95 });

function part(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, position: Position) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function box(parent: THREE.Object3D, size: Position, position: Position, material = steel) {
  return part(parent, new THREE.BoxGeometry(...size), material, position);
}

function cylinder(parent: THREE.Object3D, radius: number, height: number, position: Position, material = steel, sides = 24) {
  return part(parent, new THREE.CylinderGeometry(radius, radius, height, sides), material, position);
}

function strut(parent: THREE.Object3D, start: Position, end: Position, radius: number, material = steel) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const middle = from.clone().lerp(to, .5);
  const rod = cylinder(parent, radius, from.distanceTo(to), [middle.x, middle.y, middle.z], material, 8);
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize());
}

export function makeFacility(building: Building) {
  const group = new THREE.Group();
  const beacon = new THREE.MeshStandardMaterial({ color: building.color, emissive: building.color, emissiveIntensity: .65 });
  const grow = new THREE.MeshStandardMaterial({ color: 0x75ac73, emissive: 0x73e998, emissiveIntensity: .7 });
  const dishPivot = new THREE.Group();
  const markerHeight = { farm: 3.35, control: 6.6, comms: 5.25 }[building.id];
  cylinder(group, 3.42, .23, [0, .03, 0], footing, 8);
  cylinder(group, 3.15, .1, [0, .19, 0], dark, 8);
  for (const x of [-2.65, 2.65]) {
    for (const z of [-1.32, 1.32]) {
      box(group, [.34, .13, .34], [x, .29, z], beacon);
    }
  }

  if (building.id === 'farm') {
    box(group, [4.4, .52, 3], [0, .46, 0]);
    box(group, [4.15, .48, 2.75], [0, .94, 0], dark);
    const canopy = new THREE.MeshStandardMaterial({
      color: 0x71b994, opacity: .35, transparent: true, roughness: .27, depthWrite: false,
    });
    const roof = part(group, new THREE.CylinderGeometry(1.4, 1.4, 4.2, 28, 1, true, 0, Math.PI), canopy, [0, 1.15, 0]);
    roof.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    for (const x of [-2.15, -1.42, -.71, 0, .71, 1.42, 2.15]) {
      const rib = part(group, new THREE.TorusGeometry(1.41, .045, 6, 24, Math.PI), steel, [x, 1.15, 0]);
      rib.rotation.y = Math.PI / 2;
    }
    for (const z of [-.93, 0, .93]) {
      box(group, [3.65, .18, .59], [0, 1.22, z], dark);
      for (let index = 0; index < 8; index++) {
        const plant = part(group, new THREE.IcosahedronGeometry(.18, 1), grow, [-1.55 + index * .44, 1.42, z]);
        plant.scale.set(1.05, 1.45, 1);
      }
      box(group, [3.7, .055, .11], [0, 1.74, z], grow);
    }
    box(group, [.78, 1.05, 1.05], [2.25, .89, 0]);
    box(group, [.16, .67, .55], [2.72, .92, 0], gold);
  }

  if (building.id === 'control') {
    box(group, [4.3, .35, 3.3], [0, .46, 0]);
    const habitat = cylinder(group, 1.27, 3.35, [0, 1.56, .31], steel, 12);
    habitat.rotation.z = Math.PI / 2;
    for (const x of [-1.45, -.55, .55, 1.45]) {
      const band = cylinder(group, 1.29, .12, [x, 1.56, .31], dark, 12);
      band.rotation.z = Math.PI / 2;
    }
    box(group, [1.18, 1.56, .34], [0, 1.18, 1.39], dark);
    box(group, [.84, 1.19, .12], [0, 1.19, 1.62], gold);
    box(group, [.13, .45, .07], [.22, 1.19, 1.72], dark);
    box(group, [1.28, .18, .92], [0, .44, 1.87]);
    box(group, [1.72, 1.43, 1.58], [0, 2.77, -.53], dark);
    cylinder(group, 1.63, .26, [0, 3.41, -.53], steel, 8);
    cylinder(group, 1.48, .76, [0, 3.91, -.53], glass, 8);
    cylinder(group, 1.67, .24, [0, 4.41, -.53], steel, 8);
    cylinder(group, .52, .19, [0, 4.61, -.53], gold, 8);
    strut(group, [0, 4.65, -.53], [0, 5.72, -.53], .065);
    part(group, new THREE.SphereGeometry(.16, 12, 8), beacon, [0, 5.73, -.53]);
    for (const x of [-1.12, 1.12]) {
      box(group, [.11, .6, .1], [x, 3.92, .38], steel);
    }
  }

  if (building.id === 'comms') {
    box(group, [3.5, .46, 2.76], [0, .5, 0]);
    box(group, [2.85, 1.05, 2.05], [0, 1.04, 0], dark);
    box(group, [2.93, .14, 2.16], [0, 1.62, 0]);
    box(group, [.63, .57, .08], [0, 1.02, 1.05], gold);
    cylinder(group, .42, 1.1, [0, 1.99, -.17]);
    dishPivot.position.set(0, 2.72, -.19);
    group.add(dishPivot);
    const bowl = new THREE.Group();
    bowl.rotation.x = .76;
    dishPivot.add(bowl);
    const curve = Array.from({ length: 19 }, (_, index) => {
      const radius = index / 18 * 1.45;
      return new THREE.Vector2(radius, radius * radius * .29);
    });
    const dish = steel.clone();
    dish.side = THREE.DoubleSide;
    part(bowl, new THREE.LatheGeometry(curve, 40), dish, [0, 0, 0]);
    const rim = part(bowl, new THREE.TorusGeometry(1.45, .055, 7, 40), dark, [0, .61, 0]);
    rim.rotation.x = Math.PI / 2;
    for (const angle of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
      strut(bowl, [Math.cos(angle) * 1.26, .46, Math.sin(angle) * 1.26], [0, 1.12, 0], .033);
    }
    cylinder(bowl, .105, .25, [0, 1.14, 0], gold, 10);
    strut(group, [1.23, 1.61, -.61], [1.23, 3.61, -.61], .045);
    part(group, new THREE.SphereGeometry(.105, 10, 8), beacon, [1.23, 3.65, -.61]);
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3.38, 3.46, 64),
    new THREE.MeshBasicMaterial({ color: building.color, transparent: true, opacity: .72, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .18;
  ring.visible = false;
  group.add(ring);
  return { group, ring, beacon, grow, dishPivot, markerHeight };
}
