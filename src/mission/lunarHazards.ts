export const lunarIncidents = {
  impact: {
    title: 'Micrometeoroid impact', equipment: 'The original solar array lost one section.',
    science: 'NASA monitors flashes from impacts on the Moon to learn how often meteoroids hit the surface.',
    source: 'https://www.nasa.gov/meteoroid-environment-office/about-lunar-impact-monitoring/',
    response: 'Assign a repair team member or cover the shortfall with another array or lower power use.',
    result: 'Array section repaired', penalty: '−2 power/day in clear conditions', job: 'arrayRepair',
  },
  quake: {
    title: 'Moonquake', equipment: 'The team isolated the water recycler for inspection after detecting shaking.',
    science: 'Apollo seismometers detected impacts, deep and shallow moonquakes, and small vibrations as the surface heated or cooled.',
    source: 'https://science.nasa.gov/moon/moonquakes/',
    response: 'Assign an inspection or keep using stored water until you can spare someone.',
    result: 'Recycler inspected and isolation lifted', penalty: '−1.8 water/day and +1 power/day while the recycler would otherwise run', job: 'recyclerInspection',
  },
  dust: {
    title: 'Dust on the array', equipment: 'Surface operations left dust on the original solar array.',
    science: 'NASA tested an electric dust shield on the Moon. This drill uses dust kicked up during surface operations. LADEE investigated dust and the environment around the Moon.',
    source: 'https://www.nasa.gov/image-article/nasas-dust-shield-successfully-repels-lunar-regolith-on-moon/',
    response: 'Run the electrodynamic cleaning cycle or use stored power until the battery can spare the charge.',
    result: 'Array cleaned', penalty: '−1.5 power/day in clear conditions', job: undefined,
  },
} as const;
export type IncidentType = keyof typeof lunarIncidents;
export const impactParts = 12;
export const cleaningPower = 3;

interface StormTiming { start: number; duration: number }
export interface HazardSchedule {
  storms: [StormTiming, StormTiming];
  incident: { type: IncidentType; tick: number };
}
export interface IncidentState {
  acknowledged: boolean;
  partsReserved?: boolean;
  resolvedAt?: number;
}

const incidents = Object.keys(lunarIncidents) as IncidentType[];
export function drawHazards(random: () => number = Math.random): HazardSchedule {
  const draw = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  return {
    storms: [{ start: draw(210, 240), duration: draw(90, 120) }, { start: draw(615, 630), duration: draw(45, 60) }],
    incident: { type: incidents[draw(0, incidents.length - 1)], tick: draw(415, 475) },
  };
}

export function validHazards(schedule: HazardSchedule) {
  const within = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
  if (!schedule || !Array.isArray(schedule.storms) || schedule.storms.length !== 2) return false;
  const [first, second] = schedule.storms;
  return !!first && !!second && within(first.start, 210, 240) && within(first.duration, 90, 120)
    && within(second.start, 615, 630) && within(second.duration, 45, 60)
    && !!schedule.incident && Object.hasOwn(lunarIncidents, schedule.incident.type) && within(schedule.incident.tick, 415, 475);
}

const legacyStorms: HazardSchedule['storms'] = [{ start: 240, duration: 120 }, { start: 630, duration: 60 }];

export function stormSchedule(elapsed: number, earlier: boolean, schedule?: HazardSchedule) {
  const storms = schedule?.storms ?? legacyStorms;
  const index = storms.findIndex(storm => elapsed < storm.start + storm.duration);
  if (index === -1) return;
  const { start, duration } = storms[index];
  return { id: index + 1, warning: start - (earlier ? 90 : 60), start, end: start + duration };
}
