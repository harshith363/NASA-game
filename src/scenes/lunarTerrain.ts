import * as THREE from 'three';

const craters = [
  [-19, 4, 7], [17, -10, 7], [-10, -17, 9], [5, 13, 4],
  [20, 9, 5], [-12, 14, 3], [29, -23, 10], [-30, -12, 10], [4, -30, 12],
];

export function lunarHeight(x: number, z: number) {
  const detail = Math.sin(x * .38 + z * .23) * Math.cos(z * .51) * .32
    + Math.sin(x * 1.8 - z * 1.3) * .06;
  let height = detail;
  for (const [cx, cz, radius] of craters) {
    const distance = Math.hypot(x - cx, z - cz) / radius;
    if (distance < 1) height -= radius * .24 * (1 - distance * distance) ** 2;
    height += radius * .06 * Math.exp(-((distance - .94) ** 2) * 90);
  }
  return height;
}

function createDustTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const pixels = context.createImageData(canvas.width, canvas.height);
  let seed = 7331;
  for (let offset = 0; offset < pixels.data.length; offset += 4) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    const grain = seed / 4294967296;
    const tone = 174 + 73 * grain;
    pixels.data.set([tone, tone, tone, 255], offset);
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(27, 27);
  return texture;
}

export function buildTerrain(scene: THREE.Scene) {
  const geometry = new THREE.PlaneGeometry(185, 185, 220, 220);
  geometry.rotateX(-Math.PI / 2);
  const vertices = geometry.attributes.position;
  const colors = [];
  const color = new THREE.Color();
  for (let index = 0; index < vertices.count; index++) {
    const x = vertices.getX(index);
    const z = vertices.getZ(index);
    const height = lunarHeight(x, z);
    vertices.setY(index, height);
    const tone = .5 + Math.sin(x * .5 + Math.cos(z * .2) * 4) * .12
      + Math.sin(x * 2.91 + z * 6.71) * .075 + height * .05;
    color.setRGB(tone * .71, tone * .69, tone * .66);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const dust = createDustTexture();
  const terrain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: .98, map: dust, bumpMap: dust, bumpScale: .045,
  }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  const rocks = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0x8c8580, roughness: 1, flatShading: true }),
    540,
  );
  const shape = new THREE.Object3D();
  let seed = 997;
  const random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  for (let index = 0; index < rocks.count; index++) {
    const x = (random() - .5) * 115;
    const z = (random() - .5) * 105;
    const scale = Math.abs(x) < 15 && Math.abs(z) < 8 ? .09 : .11 + random() ** 3 * .9;
    shape.position.set(x, lunarHeight(x, z) + scale * .17, z);
    shape.scale.set(scale * 1.4, scale * .68, scale);
    shape.rotation.set(random(), random() * Math.PI, random());
    shape.updateMatrix();
    rocks.setMatrixAt(index, shape.matrix);
    rocks.setColorAt(index, color.setScalar(.55 + random() * .45));
  }
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  scene.add(rocks);
}
