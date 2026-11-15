export interface ParticleObservation {
  id: string;
  time: string;
  instruments: string[];
  url: string;
}

export const particleEndpoint = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP';

export function parseParticleReports(body: unknown): ParticleObservation[] {
  if (!Array.isArray(body)) throw new Error('Expected a DONKI report list');
  const reports: ParticleObservation[] = [];

  for (const record of body) {
    if (!record || typeof record !== 'object') continue;
    const { sepID, eventTime, instruments, link } = record;
    if (typeof sepID !== 'string' || !/^\d{4}-\d{2}-\d{2}T[\d:]+-SEP-\d+$/.test(sepID)
      || typeof eventTime !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/.test(eventTime)
      || !Number.isFinite(Date.parse(eventTime))
      || typeof link !== 'string' || !/^https:\/\/ccmc\.gsfc\.nasa\.gov\/DONKI\/(?:events|view\/SEP)\/\d+\/-?\d+\/?$/.test(link)
      || !Array.isArray(instruments)) continue;

    const names = instruments.flatMap(instrument =>
      typeof instrument?.displayName === 'string' && instrument.displayName.trim()
        ? [instrument.displayName.trim()] : [],
    );
    if (names.length) reports.push({ id: sepID, time: new Date(eventTime).toISOString(), instruments: names, url: link });
  }

  if (body.length && !reports.length) throw new Error('No usable DONKI reports');
  return reports.sort((a, b) => b.time.localeCompare(a.time));
}
