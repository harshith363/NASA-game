import type { FlightPhase } from '../data/flightScenario';

const trajectory: Record<FlightPhase, [number, number, number, number, string]> = {
  briefing: [0, 0, 0, 0, 'On the pad'],
  startup: [0, 0, 0, 0, 'Preflight checks'],
  clearance: [0, 0, 0, 0, 'Awaiting clearance'],
  countdown: [0, 0, 0, 0, 'Launch countdown'],
  ascent: [.04, 0, 0, 0, 'Powered ascent'],
  earthOrbit: [.20, 9, 400, 7.7, 'Earth parking orbit'],
  departure: [.20, 22, 400, 10.9, 'Translunar injection'],
  engineIncident: [.43, 44, 74_000, 2.4, 'Midcourse correction'],
  coast: [.57, 58, 166_000, 1.5, 'Translunar coast'],
  oxygenIncident: [.69, 72, 272_000, 1.1, 'Cabin alert'],
  lunarOrbit: [.81, 83, 381_000, 2.2, 'Lunar approach'],
  descent: [.93, 87, 384_300, 1.6, 'Lunar orbit'],
  touchdown: [.93, 88, 384_300, 1.6, 'Powered descent'],
  debrief: [1, 88, 384_400, 0, 'Lunar surface'],
  outpost: [1, 88, 384_400, 0, 'Lunar surface'],
};
const endPhase: Partial<Record<FlightPhase, FlightPhase>> = { ascent: 'earthOrbit', departure: 'engineIncident', touchdown: 'debrief' };

type RouteLeg = readonly [number, string];
function mountTrajectory(host: HTMLElement, telemetry: HTMLElement, inbound: boolean, legs: readonly RouteLeg[]) {
  const prefix = inbound ? 'inbound' : 'outbound';
  const directionLabel = inbound ? 'Moon to Earth' : 'Earth to Moon';
  const route = inbound ? 'M506 110 C 562 145 585 71 556 58 C 420 22 260 40 123 84 C 77 94 59 117 89 133' : 'M111 96 C 154 93 164 138 111 148 C 46 160 37 101 75 86 C 194 49 350 52 493 56 C 561 29 590 88 557 114 C 536 132 502 118 510 101';
  host.innerHTML = `<svg viewBox="0 0 600 170" role="img" aria-label="${directionLabel} training trajectory">
    <defs>
      <pattern id="${prefix}-flight-grid" width="23" height="23" patternUnits="userSpaceOnUse"><path d="M23 0H0V23" fill="none" stroke="#233747"/></pattern>
      <radialGradient id="${prefix}-flight-earth"><stop stop-color="#42afdd"/><stop offset="1" stop-color="#08334f"/></radialGradient>
      <radialGradient id="${prefix}-flight-moon"><stop stop-color="#cbd2d9"/><stop offset="1" stop-color="#566779"/></radialGradient>
    </defs>
    <rect width="600" height="170" fill="#091620"/><rect width="600" height="170" fill="url(#${prefix}-flight-grid)"/>
    <circle cx="98" cy="117" r="26" fill="url(#${prefix}-flight-earth)" stroke="#6fb6d6"/>
    <path d="m78 109 9-9 11 2 7 7-4 6-9-1-5 7-8-2zm25 10 10 4-2 6-7 7-3-9z" fill="#63a89c" opacity=".8"/>
    <circle cx="526" cy="90" r="22" fill="url(#${prefix}-flight-moon)" stroke="#b3c6d3"/>
    <circle cx="522" cy="82" r="7" fill="#677582"/><circle cx="535" cy="98" r="5" fill="#677582"/>
    <path id="${prefix}-flight-path" d="${route}" fill="none" pathLength="100" stroke="#38596c" stroke-width="2" stroke-dasharray="1 1"/>
    <path class="flight-track" d="${route}" fill="none" pathLength="100" stroke="#46d9eb" stroke-width="2"/>
    <g class="flight-fix"></g>
    <g class="flight-ship"><circle r="12" fill="#0a2430" stroke="#81ebfc"/><path d="M8 0-6-6-3 0-6 6Z" fill="#fff"/><path d="M0-16v-6M0 16v6M-16 0h-6M16 0h6" stroke="#81ebfc"/></g>
    <g class="flight-map-text"><text x="18" y="153">EARTH</text><text x="517" y="151">MOON</text><text x="15" y="24" class="flight-map-muted">SCHEMATIC · SIMULATED</text></g>
  </svg>`;
  const path = host.querySelector<SVGPathElement>(`#${prefix}-flight-path`)!;
  const length = path.getTotalLength();
  const track = host.querySelector<SVGPathElement>('.flight-track')!;
  const ship = host.querySelector<SVGGElement>('.flight-ship')!;
  const svg = host.querySelector('svg')!;
  const set = (attr: string, value: string) => {
    const field = telemetry.querySelector(`[data-${attr}]`)!;
    if (field.textContent !== value) field.textContent = value;
  };
  host.querySelector('.flight-fix')!.innerHTML = legs.map(([fraction, label]) => {
    const p = path.getPointAtLength(length * fraction);
    return `<path d="M${p.x} ${p.y - 4}l4 4-4 4-4-4Z" fill="#f4bf79"/><text class="flight-map-text" x="${p.x}" y="${p.y - 12}" text-anchor="middle">${label}</text>`;
  }).join('');
  return (along: number, hours: number, range: number, speed: number, status: string) => {
    const p = path.getPointAtLength(length * along);
    const next = path.getPointAtLength(length * (along >= 1 ? along - .002 : along + .002));
    const direction = (along >= 1 ? -1 : 1);
    const angle = Math.atan2(direction * (next.y - p.y), direction * (next.x - p.x)) * 180 / Math.PI;
    ship.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${angle})`);
    track.style.strokeDasharray = `${along * 100} 100`;
    svg.setAttribute('aria-label', `${directionLabel} trajectory. Spacecraft status: ${status}.`);
    const minutes = Math.floor(hours * 60);
    set('met', `T+${String(Math.floor(minutes / 60)).padStart(2, '0')}h ${String(minutes % 60).padStart(2, '0')}m`);
    set('speed', `${speed.toFixed(1)} km/s`);
    set('range', `${Math.round(range).toLocaleString()} km`);
    set('flight-status', status);
  };
}

export function mountFlightRoute(host: HTMLElement, telemetry: HTMLElement) {
  const legs: readonly RouteLeg[] = [[.2, 'Parking orbit'], [.43, 'Engine'], [.69, 'Cabin'], [.81, 'Approach']];
  const update = mountTrajectory(host, telemetry, false, legs);
  return (phase: FlightPhase, progress: number) => {
    const [start, hours, range, speed, status] = trajectory[phase];
    const [end, nextHours, nextRange, nextSpeed] = trajectory[endPhase[phase] ?? phase];
    const blend = (a: number, b: number) => a + (b - a) * progress;
    update(blend(start, end), blend(hours, nextHours), blend(range, nextRange), blend(speed, nextSpeed), status);
  };
}

const returnTelemetry = [
  [0, 0, 384400, 0, 'Lunar surface'],
  [.21, 2, 384000, 1.6, 'Lunar parking orbit'],
  [.86, 72, 120, 11, 'Earth approach'],
  [.95, 72.2, 8, .1, 'Parachute window'],
  [.98, 72.3, 1, .01, 'Parachute descent'],
  [1, 72.4, 0, 0, 'Splashdown'],
] as const;

export function mountReturnRoute(host: HTMLElement, telemetry: HTMLElement) {
  const update = mountTrajectory(host, telemetry, true, [[.21,'Lunar orbit'], [.56,'Earth transfer'], [.86,'Reentry']]);
  return (stage: number) => {
    const [along, hours, range, speed, status] = returnTelemetry[stage];
    update(along, hours, range, speed, status);
  };
}
