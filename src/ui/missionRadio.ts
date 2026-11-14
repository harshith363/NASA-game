import { archivedSolarEvent } from '../data/archivedSolarEvent';
import { lunarTraining, type Outcome } from '../mission/dailyMission';

export function mountMissionRadio(onForecast: (received: boolean) => void) {
  const request = document.querySelector<HTMLButtonElement>('#request-forecast')!;
  const status = document.querySelector<HTMLElement>('#forecast-status')!;
  const observedAt = document.querySelector<HTMLTimeElement>('#solar-observed-at')!;
  const notice = document.querySelector<HTMLElement>('#forecast-notice')!;
  let timer = 0;
  let day = 1;
  let active = false;
  let received = false;
  const storm = lunarTraining.stormStart;

  document.querySelector('#solar-observer')!.textContent = archivedSolarEvent.observer;
  observedAt.dateTime = archivedSolarEvent.observedAtUtc;
  observedAt.textContent = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long', timeZone: 'UTC',
  }).format(new Date(archivedSolarEvent.observedAtUtc));
  document.querySelector<HTMLAnchorElement>('#solar-source')!.href = archivedSolarEvent.sourceUrl;

  function render(currentDay: number, outcome: Outcome) {
    day = currentDay;
    active = outcome === 'active';
    request.setAttribute('aria-disabled', String(Boolean(timer) || received || !active));
  }

  request.addEventListener('click', () => {
    if (timer || received || !active) return;
    request.setAttribute('aria-disabled', 'true');
    status.textContent = 'Signal sent. Waiting for Mission Control…';
    timer = window.setTimeout(() => {
      timer = 0;
      received = true;
      const text = day > storm + 1
        ? 'The particle alert has passed. Habitat operations can resume.'
        : `Use the shelter on days ${storm} and ${storm + 1}. On day ${storm + 1}, the air system needs one extra power. Reserve mode also needs one extra air.`;
      status.textContent = text;
      notice.textContent = text;
      onForecast(true);
    }, 4000);
  });

  return {
    render,
    reset() {
      clearTimeout(timer);
      timer = 0;
      received = false;
      status.textContent = '';
      notice.textContent = '';
      onForecast(false);
      render(day, active ? 'active' : 'ready');
    },
  };
}
