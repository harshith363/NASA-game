import { feeds, type ExternalTelemetry, type FeedId, type TelemetryReading } from '../data/telemetry.ts';

const swpc = 'https://services.swpc.noaa.gov/';
const headers = { 'User-Agent': 'Lunar-Outpost/1.0 (NASA Hackathon training project)', Accept: 'application/json, application/geo+json' };
const cache: ExternalTelemetry = {};
let checkedAt = 0;
let pending: Promise<ExternalTelemetry> | undefined;

async function fetchJson(url: string) {
  const result = await fetch(url, { headers, signal: AbortSignal.timeout(6500) });
  if (!result.ok) throw new Error(`Upstream returned ${result.status}`);
  return result.json();
}

function utc(input: unknown) {
  if (typeof input !== 'string') return;
  const explicit = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(input) ? input : input + 'Z';
  const milliseconds = Date.parse(explicit);
  if (Number.isFinite(milliseconds)) return new Date(milliseconds).toISOString();
}
function record(value: unknown): Record<string,unknown> {
  return value && typeof value === 'object' ? value as Record<string,unknown> : {};
}
function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
}
function latest(body: unknown, field: string, accept: (row: Record<string,unknown>) => boolean = () => true): TelemetryReading | undefined {
  if (!Array.isArray(body)) return;
  let result: TelemetryReading | undefined;
  for (const item of body) {
    const row = record(item);
    if (!accept(row)) continue;
    const time = utc(row.time_tag);
    const value = readNumber(row[field]);
    if (time && value !== undefined && value >= 0 && (!result || time > result.time)) result = { time, value };
  }
  return result;
}
function fromReading(id: FeedId, reading?: TelemetryReading): ExternalTelemetry {
  return reading ? { [id]: reading } : {};
}

export function parseHorizons(body: unknown): ExternalTelemetry {
  const result = record(body).result;
  if (typeof result !== 'string') return {};
  const line = result.split('$$SOE')[1]?.split('$$EOE')[0]?.trim().split('\n')[0];
  if (!line) return {};
  const [date, , , illumination, distance, , lightTime] = line.split(',').map(part => part.trim());
  const time = utc(date);
  const illuminated = readNumber(illumination), rangeAu = readNumber(distance), travelMinutes = readNumber(lightTime);
  if (!time || illuminated === undefined || rangeAu === undefined || travelMinutes === undefined
    || illuminated < 0 || illuminated > 100 || rangeAu <= 0 || travelMinutes <= 0) return {};
  return {
    illumination: { value: illuminated, time },
    distance: { value: rangeAu * 149597870.7, time },
    lightTime: { value: travelMinutes * 60, time },
  };
}

async function astronomy(now: Date) {
  const format = (time: Date) => time.toISOString().slice(0,16).replace('T',' ');
  const query = new URLSearchParams({
    format:'json', COMMAND:"'301'", CENTER:"'500@399'", EPHEM_TYPE:"'OBSERVER'",
    START_TIME:`'${format(now)}'`, STOP_TIME:`'${format(new Date(now.getTime()+120000))}'`,
    STEP_SIZE:"'1 min'", QUANTITIES:"'10,20,21'", CSV_FORMAT:"'YES'",
  });
  return parseHorizons(await fetchJson(`https://ssd.jpl.nasa.gov/api/horizons.api?${query}`));
}

async function particleEvents(now: Date): Promise<ExternalTelemetry> {
  const endDate = now.toISOString().slice(0,10);
  const startDate = new Date(now.getTime()-30*86400000).toISOString().slice(0,10);
  const body = await fetchJson(`https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=${startDate}&endDate=${endDate}`);
  if (!Array.isArray(body)) return {};
  let event: TelemetryReading | undefined;
  for (const item of body) {
    const row = record(item);
    const time = utc(row.eventTime);
    if (time && typeof row.sepID === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:]+-SEP-\d+$/.test(row.sepID)
      && (!event || time > event.time)) event = { time, value: row.sepID };
  }
  return fromReading('particle', event ?? { value: 'No catalog entries in the last 30 days', time: now.toISOString() });
}

async function weather(): Promise<ExternalTelemetry> {
  const body = await fetchJson('https://api.weather.gov/stations/KMLB/observations/latest');
  const properties = record(record(body).properties);
  const time = utc(properties.timestamp);
  const wind = record(properties.windSpeed);
  const speed = readNumber(wind.value);
  if (!time || speed === undefined || speed < 0) return {};
  if (wind.unitCode === 'wmoUnit:km_h-1') return { earthWind:{ time, value:speed } };
  if (wind.unitCode === 'wmoUnit:m_s-1') return { earthWind:{ time, value:speed*3.6 } };
  return {};
}

async function load(now: Date): Promise<ExternalTelemetry> {
  const results = await Promise.allSettled([
    astronomy(now),
    fetchJson(swpc+'json/rtsw/rtsw_wind_1m.json').then(body => ({
      ...fromReading('solarSpeed',latest(body,'proton_speed',row => row.active !== false)),
      ...fromReading('solarDensity',latest(body,'proton_density',row => row.active !== false)),
    })),
    fetchJson(swpc+'json/goes/primary/xrays-6-hour.json').then(body => fromReading('xray',latest(body,'flux',row => row.energy === '0.1-0.8nm'))),
    fetchJson(swpc+'json/goes/primary/integral-protons-6-hour.json').then(body => fromReading('protons',latest(body,'flux',row => row.energy === '>=10 MeV'))),
    fetchJson(swpc+'products/noaa-planetary-k-index.json').then(body => fromReading('kp',latest(body,'Kp'))),
    particleEvents(now),
    weather(),
  ]);
  const readings: ExternalTelemetry = {};
  for (const result of results) if (result.status === 'fulfilled') Object.assign(readings,result.value);
  for (const id of Object.keys(feeds) as FeedId[]) {
    if (readings[id]) cache[id] = readings[id];
    else if (cache[id]) cache[id] = { ...cache[id], cached: true };
  }
  checkedAt = Date.now();
  return { ...cache };
}

export function requestExternalTelemetry() {
  if (pending) return pending;
  const freshness = Object.keys(cache).length ? 60_000 : 10_000;
  if (Date.now() - checkedAt < freshness) return Promise.resolve({ ...cache });
  pending = load(new Date()).finally(() => { pending = undefined; });
  return pending;
}
