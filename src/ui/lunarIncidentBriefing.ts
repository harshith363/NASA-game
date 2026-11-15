import { cleaningPower, impactParts } from '../mission/lunarHazards';
import { cleanArray, outpostIncident, rates, resourceDeltas, type OutpostState } from '../mission/outpostSimulation';

export function mountLunarIncidentBriefing(
  host: HTMLElement, getState: () => OutpostState, changed: () => void, openJobs: () => void, fallbackFocus: HTMLElement,
) {
  const dialog = document.createElement('dialog');
  dialog.className = 'console mission-dialog timed-alert';
  dialog.setAttribute('aria-labelledby', 'lunar-incident-title');
  dialog.innerHTML = `<header><h2 id="lunar-incident-title" tabindex="-1"></h2><button class="icon-button" aria-label="Close equipment alert">×</button></header>
    <h3>Equipment status</h3><p data-equipment></p><p data-reserves></p>
    <h3>What you can do</h3><p data-response></p><p data-cost></p>
    <div class="campaign-actions"><button class="action" data-respond></button><button class="radio-action" data-done>Close alert</button></div>
    <p data-result role="status"></p>
    <details><summary>About this drill</summary><p data-science></p><p><a target="_blank" rel="noopener noreferrer">NASA background</a></p></details>
    <p>Equipment effects and costs use simulated training values.</p>`;
  host.append(dialog);
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
  const respond = q<HTMLButtonElement>('[data-respond]');
  let caller: HTMLElement | null;
  let toJobs = false;
  function refresh() {
    const state = getState();
    const incident = outpostIncident(state);
    if (!incident) return;
    const named = q('#lunar-incident-title');
    named.textContent = incident.title;
    const resolved = incident.resolvedAt !== undefined;
    q('[data-equipment]').textContent = resolved ? incident.result : `${incident.equipment} ${incident.penalty}.`;
    const flow = rates(state);
    q('[data-reserves]').textContent = `${state.battery.toFixed(1)} power · ${state.water.toFixed(1)} water · ${resourceDeltas({}, { battery: flow.battery, water: flow.water }, '/day') || 'steady rates'}.`;
    q('[data-response]').textContent = resolved ? 'The outpost can use the equipment again.' : incident.response;
    const lightEffect = resourceDeltas(flow, rates({ ...state, growLights: false }), '/day');
    q('[data-cost]').textContent = resolved ? '' : incident.type === 'dust'
      ? `Cleaning uses −${cleaningPower} power now and restores +1.5 power/day in clear conditions.`
      : incident.type === 'impact'
        ? `${incident.partsReserved ? 'Repair parts reserved.' : `−${impactParts} materials on assignment.`} 30 sim seconds with Aya plus walking. ${lightEffect ? `Switching lights off now changes rates by ${lightEffect}.` : ''}`
        : '24 sim seconds with Mateo plus walking. Inspection restores +1.8 water/day when the recycler is switched on.';
    respond.hidden = resolved;
    respond.textContent = incident.job ? 'Open Mission Control jobs' : 'Run cleaning cycle';
    q('[data-science]').textContent = incident.science;
    q<HTMLAnchorElement>('a').href = incident.source;
  }
  respond.onclick = () => {
    if (outpostIncident(getState())?.job) { toJobs = true; dialog.close(); return; }
    const error = cleanArray(getState());
    q('[data-result]').textContent = error || getState().message;
    changed();
    refresh();
    if (!error) q('[data-done]').focus();
  };
  for (const selector of ['.icon-button', '[data-done]']) q(selector).onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    const { incident } = getState().campaign;
    if (incident) incident.acknowledged = true;
    changed();
    if (toJobs) openJobs();
    else (caller && caller !== document.body && caller.getClientRects().length ? caller : fallbackFocus).focus();
  });
  return {
    show() {
      if (document.querySelector('dialog[open]')) return;
      caller = document.activeElement as HTMLElement | null;
      toJobs = false;
      q('[data-result]').textContent = '';
      refresh();
      dialog.showModal();
      dialog.scrollTop = 0;
      q('#lunar-incident-title').focus();
    },
  };
}
