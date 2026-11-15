import { feeds, type ExternalTelemetry, type FeedId } from '../data/telemetry';
import { estimateDriveCost, missionSunElevation } from '../mission/lunarSurface';
import { locations, shelteredCount } from '../mission/lunarCampaign';
import { missionDay, rates, outpostStorm, type OutpostState } from '../mission/outpostSimulation';

const number = new Intl.NumberFormat('en', { maximumFractionDigits:2 });
const date = new Intl.DateTimeFormat('en-GB',{ dateStyle:'medium',timeStyle:'short',timeZone:'UTC' });

export function mountTowerTelemetry(button: HTMLButtonElement, host: HTMLElement, getState: () => OutpostState) {
  const dialog = document.createElement('dialog');
  dialog.className = 'console mission-dialog telemetry-dialog';
  dialog.setAttribute('aria-labelledby','tower-telemetry-title');
  dialog.innerHTML = `
    <header><div><p class="eyebrow">Control Tower · Incoming transmission</p><h2 id="tower-telemetry-title">Telemetry report</h2></div>
      <form method="dialog"><button class="icon-button" aria-label="Close telemetry" autofocus>×</button></form></header>
    <p id="tower-telemetry-status" role="status"></p>
    <div id="tower-telemetry-readings"></div>
    <button id="tower-telemetry-refresh" class="radio-action">Request updated report</button>
    <p class="telemetry-note">NASA and NOAA values provide real-world context. GOES proton readings describe near-Earth conditions. The outpost follows its own simulated storm schedule.</p>`;
  host.append(dialog);
  button.setAttribute('aria-haspopup','dialog');
  const status = dialog.querySelector('#tower-telemetry-status')!;
  const readings = dialog.querySelector('#tower-telemetry-readings')!;
  const refresh = dialog.querySelector<HTMLButtonElement>('#tower-telemetry-refresh')!;
  let remote: ExternalTelemetry = {};
  let pending = false;
  let received = false;

  function section(title: string, rows: { label:string; value:string; note:string; link?:string }[], simulated = false) {
    const block = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = title;
    const list = document.createElement('dl');
    list.className = 'telemetry-grid';
    for (const row of rows) {
      const card = document.createElement('div');
      const label = document.createElement('dt'); label.textContent = row.label;
      const value = document.createElement('dd'); value.textContent = row.value;
      const note = document.createElement(row.link ? 'a' : 'small');
      note.textContent = row.note;
      if (note instanceof HTMLAnchorElement && row.link) { note.href = row.link; note.target = '_blank'; note.rel = 'noopener'; }
      if (simulated) {
        const badge = document.createElement('span');
        badge.className = 'telemetry-simulated';
        badge.textContent = 'Simulated';
        card.append(label, badge, value, note);
      } else card.append(label, value, note);
      list.append(card);
    }
    block.append(heading,list);
    return block;
  }
  function render(snapshot: OutpostState) {
    const rover = snapshot.campaign.rover;
    const phase = outpostStorm(snapshot);
    const radiation = phase === 'peak' ? 'High outside shelter' : phase === 'warning' ? 'Elevated' : 'Background';
    const inShelter = shelteredCount(snapshot.campaign,snapshot.sheltered);
    const mission = [
      { label:'Sun elevation',value:`${number.format(missionSunElevation(snapshot.elapsed))}°`,note:'Simulated outpost horizon' },
      { label:'Local radiation',value:radiation,note:`Simulated · ${inShelter}/5 crew sheltered` },
      { label:'Solar generation',value:`${number.format(rates(snapshot).solarOutput)} power/day`,note:'Simulated · before power consumption' },
      { label:'Rover charge / estimated return',value:`${number.format(rover.charge)} / ${number.format(estimateDriveCost(rover.position,locations.dock))} charge`,note:'Simulated · direct route estimate' },
      { label:'Radar contacts',value:`${rover.contacts.length} discovered · ${rover.collected.length} collected`,note:'Simulated · tower and rover scans' },
    ];
    const groups = ['Astronomy','Solar and space','Earth'] as const;
    readings.replaceChildren(section(`Mission telemetry · ${missionDay(snapshot.elapsed)}`,mission, true), ...groups.map(group => {
      const cards = (Object.keys(feeds) as FeedId[]).filter(id => feeds[id].group === group).map(id => {
        const spec = feeds[id], reading = remote[id];
        const available = reading && Number.isFinite(Date.parse(reading.time));
        const formatted = typeof reading?.value === 'number'
          ? id === 'xray' ? reading.value.toExponential(2) : number.format(reading.value)
          : reading?.value;
        const value = available ? `${formatted}${spec.unit ? ' '+spec.unit : ''}` : pending ? 'Awaiting data…' : 'Unavailable';
        const timestamp = available ? ` · ${date.format(new Date(reading.time))} UTC${reading.cached ? ' · cached' : ''}` : '';
        return { label:spec.label,value,note:spec.source+timestamp,link:spec.url };
      });
      return section(group === 'Astronomy' ? 'Calculated astronomy' : `${group} observations`,cards);
    }));
  }
  async function request() {
    if (pending) return;
    pending = true;
    refresh.disabled = true;
    status.textContent = 'Mission readings received. Requesting NASA and NOAA data…';
    render(getState());
    try {
      const response = await fetch('/.netlify/functions/telemetry',{ signal:AbortSignal.timeout(9000) });
      if (!response.ok) throw new Error('Telemetry unavailable');
      const data = await response.json() as ExternalTelemetry;
      remote = data;
      received = Object.keys(remote).length > 0;
    } catch {
      remote = Object.fromEntries(Object.entries(remote).map(([key,reading]) => [key,{...reading,cached:true}]));
    } finally {
      pending = false;
      refresh.disabled = false;
      const count = Object.keys(remote).length;
      const cached = Object.values(remote).some(reading => reading.cached);
      status.textContent = received
        ? `${count} of 10 external readings available${cached ? ' · includes cached readings' : ''}.`
        : 'External feeds are unavailable. Mission readings are available below.';
      render(getState());
    }
  }
  button.onclick = () => { dialog.showModal(); render(getState()); void request(); };
  refresh.onclick = () => void request();
}
