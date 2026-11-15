import { archivedSolarEvent } from '../data/archivedSolarEvent';
import { parseParticleReports, particleEndpoint, type ParticleObservation } from '../data/donki';

const formatUtc = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
});

export function mountControlCentre() {
  const panel = document.querySelector<HTMLElement>('#tower-observatory')!;
  const buttons = [...panel.querySelectorAll<HTMLButtonElement>('[data-particle-query]')];
  const status = panel.querySelector<HTMLElement>('#particle-status')!;
  const results = panel.querySelector<HTMLUListElement>('#particle-results')!;
  let loading = false;

  function reportItem(report: ParticleObservation) {
    const item = document.createElement('li');
    const time = document.createElement('time');
    time.dateTime = report.time;
    time.textContent = `${formatUtc.format(new Date(report.time))} UTC`;
    const instruments = document.createElement('p');
    instruments.textContent = report.instruments.join(', ');
    const source = document.createElement('a');
    source.href = report.url;
    source.target = '_blank';
    source.rel = 'noopener';
    source.textContent = report.id;
    item.append(time, instruments, source);
    return item;
  }

  async function load(archive: boolean) {
    if (loading) return;
    loading = true;
    buttons.forEach(button => button.setAttribute('aria-disabled', 'true'));
    results.replaceChildren();
    results.hidden = true;
    status.textContent = 'Contacting NASA’s particle event catalog…';
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 29);
    const startDate = archive ? archivedSolarEvent.observedAtUtc.slice(0, 10) : start.toISOString().slice(0, 10);
    const endDate = archive ? '2024-05-12' : now.toISOString().slice(0, 10);

    try {
      const query = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`${particleEndpoint}?${query}`, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`DONKI returned ${response.status}`);
      const reports = parseParticleReports(await response.json());
      const shown = archive ? reports.filter(report => report.id === archivedSolarEvent.activityId).slice(0, 1) : reports.slice(0, 5);
      if (shown.length) {
        results.replaceChildren(...shown.map(reportItem));
        results.hidden = false;
        const description = archive ? 'Training event retrieved from NASA DONKI.' : `Showing ${shown.length} of ${reports.length} reports for ${startDate} to ${endDate}.`;
        status.textContent = `${description} Checked ${formatUtc.format(new Date())} UTC.`;
      } else {
        status.textContent = archive
          ? 'NASA’s response did not include the training event. The archived record is available below.'
          : `NASA listed no particle events from ${startDate} to ${endDate}. An empty catalog does not indicate safe conditions.`;
      }
    } catch {
      status.textContent = 'NASA’s catalog is unavailable right now. Try again or use the archived training record below.';
    } finally {
      loading = false;
      buttons.forEach(button => button.removeAttribute('aria-disabled'));
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => void load(button.dataset.particleQuery === 'training'));
  }
}
