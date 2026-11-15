import * as THREE from 'three';
import type { FacilityType } from '../mission/outpostSimulation';

export function box(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], color: number, glow = false) {
  const item = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({
    color, roughness: .68, emissive: glow ? color : 0, emissiveIntensity: .45,
  }));
  item.position.set(...position);
  item.castShadow = item.receiveShadow = true;
  parent.add(item);
  return item;
}

export function disposeModel(model: THREE.Object3D) {
  model.traverse(item => {
    if (!(item instanceof THREE.Mesh)) return;
    item.geometry.dispose();
    (item.material as THREE.Material).dispose();
  });
  model.removeFromParent();
}

export function expansionModel(type: FacilityType, complete: boolean, online: boolean) {
  const group = new THREE.Group();
  box(group, [2.7,.16,2], [0,.08,0], 0x535b66);
  if (!complete) {
    for (const x of [-1.2,1.2]) for (const z of [-.85,.85]) box(group,[.09,1.5,.09],[x,.8,z],0xffb660);
    for (const x of [-1.2,1.2]) box(group,[.08,.08,1.8],[x,1.55,0],0xad7951);
    for (const z of [-.85,.85]) box(group,[2.45,.08,.08],[0,1.55,z],0xad7951);
    box(group,[.55,.42,.62],[.65,.32,.32],0xc68d48);
    box(group,[.8,.055,.3],[-.6,.2,.45],0x8c9ba3);
  } else if (type === 'solar') {
    for (const x of [-.78,.78]) {
      box(group,[.15,.87,.16],[x,.55,0],0xd4d4c7);
      const panel = new THREE.Group();
      panel.position.set(x,1,0);
      panel.rotation.x = -.36;
      group.add(panel);
      box(panel,[1.43,.13,1.45],[0,0,0],0xaeb8c4);
      for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) {
        box(panel,[.31,.025,.31],[(row-1.5)*.33,.076,(column-1.5)*.33],online ? (row % 2 ? 0x2b5291 : 0x375fa9) : 0x4c5360);
      }
    }
    box(group,[.32,.12,1.5],[0,.22,0],0x22272d);
    box(group,[.3,.19,.32],[0,.29,.61],online ? 0x89dab5 : 0x746a60, online);
  } else if (type === 'battery') {
    box(group,[2.35,.18,.85],[0,.23,.35],0xd4a663);
    for (const x of [-.79,0,.79]) {
      box(group,[.68,.77,1.25],[x,.55,0],0xb9c2c8);
      box(group,[.45,.4,.08],[x,.58,.64],0x303b46);
      box(group,[.26,.07,.09],[x,.65,.69],online ? 0x78e4ad : 0x565862,online);
      for (const y of [.34,.41,.48]) box(group,[.34,.02,.09],[x,y,.69],0x748594);
    }
  } else {
    const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,2.45,18,1,true,0,Math.PI),
      new THREE.MeshStandardMaterial({ color:0x9fd6bc, transparent:true, opacity:.34, side:THREE.DoubleSide, depthWrite:false }));
    tunnel.rotation.x = Math.PI / 2; tunnel.rotation.z = -Math.PI / 2;
    tunnel.position.y = .43; group.add(tunnel);
    for (const z of [-1,0,1]) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(.85,.043,6,20,Math.PI),
        new THREE.MeshStandardMaterial({ color:0xbfcbd0 }));
      rib.position.set(0,.43,z); group.add(rib);
    }
    for (const x of [-.43,.43]) for (const z of [-.77,0,.77]) {
      box(group,[.54,.13,.49],[x,.3,z],0x514438);
      box(group,[.32,.19,.28],[x,.46,z],online ? 0x79be63 : 0x55694c);
    }
    box(group,[.12,.06,1.95],[0,1.14,0],online ? 0xd395fa : 0x536168,online);
  }
  return group;
}

export function roverModel() {
  const model = new THREE.Group();
  const body = new THREE.Group();
  model.add(body);
  const wheels = [];
  const alloy = 0x71818d, white = 0xd8e0dd, orange = 0xcf8b49, dark = 0x252c33;
  box(body,[1.24,.13,2.15],[0,.51,0],alloy);
  box(body,[.89,.27,1.7],[0,.55,0],dark);
  for (const x of [-.48,.48]) {
    box(body,[.14,.14,2.15],[x,.64,0],white);
    box(body,[.33,.15,.42],[x*.71,.67,-.13],0x57616d);
    const back = box(body,[.34,.39,.1],[x*.71,.85,-.31],0x657481);
    back.rotation.x = -.12;
    box(body,[.14,.12,.16],[x,.76,1.04],0xe6d6a8,true);
    box(body,[.13,.08,.14],[x,.65,-1.06],0x8e332c,true);
  }
  box(body,[1.21,.28,.56],[0,.73,.79],white);
  const console = box(body,[.76,.08,.36],[0,.93,.54],dark);
  console.rotation.x = -.26;
  box(body,[.24,.06,.16],[.18,.98,.55],0x579db6,true);
  box(body,[1.08,.32,.62],[0,.77,-.77],orange);
  for (const x of [-.4,0,.4]) box(body,[.045,.33,.64],[x,.78,-.77],0xafb5ae);
  box(body,[.07,.83,.075],[-.51,1.16,-.55],alloy);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.31,.065,.105,18), new THREE.MeshStandardMaterial({color:0xd3e0de,metalness:.35,roughness:.5}));
  antenna.position.set(-.51,1.6,-.55); antenna.rotation.z = .4; body.add(antenna);
  for (const x of [-.79,.79]) for (const z of [-.76,.76]) {
    const knuckle = new THREE.Group(); knuckle.position.set(x,.36,z); model.add(knuckle);
    const roll = new THREE.Group(); knuckle.add(roll);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.27,24),new THREE.MeshStandardMaterial({color:0x242a2f,roughness:1}));
    tire.rotation.z = Math.PI/2; tire.castShadow = true; roll.add(tire);
    for (let i=0;i<12;i++) {
      const angle = i*Math.PI/6;
      const cleat = box(roll,[.29,.04,.078],[0,.35*Math.cos(angle),.35*Math.sin(angle)],0x414954);
      cleat.rotation.x = angle;
    }
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.28,16),new THREE.MeshStandardMaterial({ color:0x8b98a0,metalness:.45,roughness:.45 }));
    rim.rotation.z = Math.PI/2; roll.add(rim);
    const strut = box(model,[.12,.12,1],[0,0,0],alloy);
    wheels.push({ x,z,knuckle,roll,strut });
  }
  return { model, body, wheels };
}
