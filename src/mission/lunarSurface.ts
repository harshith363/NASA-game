const craters = [
  [-19, 4, 7], [17, -10, 7], [-10, -17, 9], [5, 13, 4],
  [20, 9, 5], [-12, 14, 3], [29, -23, 10], [-30, -12, 10], [4, -30, 12],
  [43, -21, 13], [-43, -32, 12], [40, 28, 13], [-42, 26, 10],
];

export function lunarHeight(x: number, z: number) {
  const detail = Math.sin(x * .38 + z * .23) * Math.cos(z * .51) * .32
    + Math.sin(x * 1.8 - z * 1.3) * .06;
  const outer = Math.min(1, Math.max(0, (Math.hypot(x, z) - 17) / 20));
  let height = detail + outer * (.8 * Math.sin(x * .14 + z * .19) + .24 * Math.sin(x * .92) * Math.sin(z * .63));
  for (const [cx, cz, radius] of craters) {
    const distance = Math.hypot(x - cx, z - cz) / radius;
    if (distance < 1) height -= radius * .24 * (1 - distance * distance) ** 2;
    height += radius * .06 * Math.exp(-((distance - .94) ** 2) * 90);
  }
  return height;
}

export const roverBounds = { left: -54, right: 55, top: -46, bottom: 43 } as const;
export const cacheSites = {
  cache: { name: 'East Rim cache', point: [19, 13], materials: 40, sector: 'east of the dock' },
  ridge: { name: 'High Ridge cache', point: [39, -23], materials: 35, sector: 'northeast beyond the crater rim' },
  flats: { name: 'South Flats cache', point: [26, 33], materials: 25, sector: 'southeast past the low basin' },
  basin: { name: 'Shadow Basin cache', point: [-42, -20], materials: 50, sector: 'northwest beyond the overlook' },
  west: { name: 'West Traverse cache', point: [-7, 15], materials: 15, sector: 'southwest of the dock' },
  shoulder: { name: 'North Shoulder cache', point: [11, -16], materials: 20, sector: 'north of the base toward North Ray' },
  pass: { name: 'Southwest Pass cache', point: [-33, 25], materials: 25, sector: 'far southwest past Genesis Ridge' },
} as const;
export type CacheId = keyof typeof cacheSites;
export const cacheIds = Object.keys(cacheSites) as CacheId[];
export const cacheTotal = cacheIds.reduce((total, id) => total + cacheSites[id].materials, 0);
export const explorationMaterialTarget = 150;
export const radarRange = 27;

export function groundSlope(x: number, z: number, heading: number) {
  const dx = Math.sin(heading) * .5;
  const dz = Math.cos(heading) * .5;
  return lunarHeight(x + dx, z + dz) - lunarHeight(x - dx, z - dz);
}

export function tractionAt(x: number, z: number) {
  const roughness = Math.abs(lunarHeight(x + .65, z) - 2*lunarHeight(x, z) + lunarHeight(x - .65, z))
    + Math.abs(lunarHeight(x, z + .65) - 2*lunarHeight(x, z) + lunarHeight(x, z - .65));
  return Math.max(.52, 1 - roughness * 1.65);
}

export function travelCost(x: number, z: number, heading: number) {
  return .19 + Math.max(0, groundSlope(x, z, heading)) * .18 + (1 - tractionAt(x,z)) * .11;
}

export function estimateDriveCost(from: readonly [number,number], to: readonly [number,number]) {
  const dx = to[0] - from[0], dz = to[1] - from[1];
  const length = Math.hypot(dx,dz);
  const samples = Math.max(1, Math.ceil(length / 2));
  const heading = Math.atan2(dx,dz);
  let cost = 0;
  for (let i = 0; i < samples; i++) {
    const fraction = (i + .5) / samples;
    cost += travelCost(from[0] + dx*fraction, from[1] + dz*fraction, heading) * length / samples;
  }
  return cost;
}

// The training site stays sunlit during the campaign. Its sun angle moves slowly across the sky.
export function missionSunElevation(elapsed: number) {
  return 32 + 18 * Math.sin(elapsed / 60 / 29.53 * Math.PI * 2);
}
