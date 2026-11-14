import { archivedSolarEvent } from '../data/archivedSolarEvent';
import { shiftDemand, type MissionState } from '../mission/solarStorm';

export function mountMissionRadio(onForecast: () => void) {
  const request = document.querySelector<HTMLButtonElement>('#request-forecast')!;
  const status = document.querySelector<HTMLElement>('#forecast-status')!;
  const observedAt = document.querySelector<HTMLTimeElement>('#solar-observed-at')!;
  const notice = document.querySelector<HTMLElement>('#forecast-notice')!;
  const wave = document.querySelector<HTMLElement>('#forecast-detail')!;
  let timer = 0;
  let deliveredAt: number | undefined;
  let state: MissionState;
  let text = '';

  document.querySelector('#solar-observer')!.textContent = archivedSolarEvent.observer;
  observedAt.dateTime = archivedSolarEvent.observedAtUtc;
  observedAt.textContent = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long', timeZone: 'UTC',
  }).format(new Date(archivedSolarEvent.observedAtUtc));
  document.querySelector<HTMLAnchorElement>('#solar-source')!.href = archivedSolarEvent.sourceUrl;

  function render(current: MissionState) {
    state = current;
    if (deliveredAt === undefined) {
      wave.textContent = 'Forecast: no reply yet.';
      return;
    }
    const age = Math.max(0, current.completedShifts - deliveredAt);
    wave.textContent = `Forecast: ${age ? `${age} ${age === 1 ? 'shift' : 'shifts'} ago` : 'received this round'}. ${text}`;
  }

  request.addEventListener('click', () => {
    if (request.getAttribute('aria-disabled') === 'true' || state.outcome !== 'active') return;
    request.setAttribute('aria-disabled', 'true');
    status.textContent = 'Signal sent. Waiting for Mission Control…';
    timer = window.setTimeout(() => {
      timer = 0;
      deliveredAt = state.completedShifts;
      const demand = shiftDemand(state, 1);
      text = `Peak lasts one shift. The air system needs ${demand.addedPower} extra power; reserve mode draws ${demand.addedAir} extra air too. Expect recovery after the peak.`;
      status.textContent = text;
      notice.textContent = `Forecast received · ${text}`;
      render(state);
      onForecast();
    }, 4000);
  });

  function cancelPending() {
    clearTimeout(timer);
    timer = 0;
    if (deliveredAt === undefined && status.textContent) status.textContent = 'Request ended with the drill.';
  }

  return {
    render, cancelPending,
    reset() {
      cancelPending();
      deliveredAt = undefined;
      text = '';
      request.removeAttribute('aria-disabled');
      status.textContent = '';
      notice.textContent = '';
    },
  };
}
