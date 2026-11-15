import cabin from '../data/flight-cabin.json';
import artemis from '../data/flight-artemis.json';

export function cabinEvidence() {
  const values = cabin.samples.map(s => s.co2);
  const low = Math.floor(Math.min(...values) / 100) * 100, high = Math.ceil(Math.max(...values) / 100) * 100 + 100;
  const points = values.map((v, i) => `${35 + i * 27},${125 - (v - low) / (high - low) * 100}`).join(' ');
  return `<details class="flight-evidence"><summary>Real ISS cabin CO₂ readings · RR-1</summary><p>NASA OSDR · ISS cabin · 26 September 2014, 00:00–11:00 GMT. Twelve sampled readings, in parts per million (ppm). These are historical measurements, not your spacecraft’s air.</p><svg viewBox="0 0 380 165" role="img" aria-label="ISS cabin CO₂ ranges from ${Math.min(...values)} to ${Math.max(...values)} parts per million in this sample"><text x="0" y="18" fill="currentColor">${high} ppm</text><text x="0" y="145" fill="currentColor">${low} ppm</text><polyline points="${points}" fill="none" stroke="#8bdbef" stroke-width="3"/><text x="60" y="160" fill="currentColor">00:00 → 11:00 GMT</text></svg><p>Mateo: The scrubber removes CO₂ exhaled by the crew. The oxygen supply does a different job.</p><details><summary>Read the values</summary><ul>${cabin.samples.map(s => `<li>${s.time} GMT · ${s.co2} ppm</li>`).join('')}</ul></details><a href="${cabin.source}" target="_blank" rel="noopener">NASA source and mission dashboard</a></details>`;
}
export function artemisEvidence() {
  const xs = artemis.samples.map(s => s.x), ys = artemis.samples.map(s => s.y);
  const minX = Math.min(0, ...xs), maxX = Math.max(0, ...xs), minY = Math.min(0, ...ys), maxY = Math.max(0, ...ys);
  const scale = Math.min(500 / (maxX - minX), 250 / (maxY - minY));
  const project = (x: number, y: number) => [45 + (x - minX) * scale, 280 - (y - minY) * scale];
  const points = artemis.samples.map(s => project(s.x, s.y).join(',')).join(' ');
  const earth = project(0, 0);
  return `<details class="flight-evidence"><summary>Compare with Artemis II</summary><p>NASA’s Artemis II flew around the Moon and returned to Earth. Our training mission lands instead. This separate chart shows 97 points from NASA’s published orbit solution.</p><svg viewBox="0 0 600 320" role="img" aria-label="Artemis II Earth-centered XY trajectory projection, April 2–10 2026, leaving Earth and returning"><polyline points="${points}" fill="none" stroke="#8bdbef" stroke-width="2"/><circle cx="${earth[0]}" cy="${earth[1]}" r="5" fill="#ffc784"/><text x="${earth[0]+8}" y="${earth[1]+12}" fill="currentColor">Earth</text><text x="30" y="310" fill="currentColor">Blue: published Artemis II orbit solution</text></svg><p>Earth-centered EME2000 frame, XY projection; source positions in km and time in UTC. 2–10 April 2026. Published solution created 10 April at 03:22 UTC; later points are predictions from that solution. Earth symbol enlarged. This is not live telemetry and does not drive game resources.</p><a href="https://svs.gsfc.nasa.gov/5632" target="_blank" rel="noopener">NASA visualization and credits</a> · <a href="${artemis.source}" target="_blank" rel="noopener">Original ephemeris archive</a></details>`;
}
