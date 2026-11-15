import { lunarLandmarks, type LandmarkId } from '../data/lunarLandmarks';
import { collectSpecimen, visitLandmark, type OutpostState } from '../mission/outpostSimulation';

export function mountLandmarkExhibit(
  host: HTMLElement, getState: () => OutpostState, pause: () => void, changed: () => void, fallbackFocus: HTMLElement,
) {
  const dialog = document.createElement('dialog');
  dialog.className = 'console mission-dialog timed-alert';
  dialog.setAttribute('aria-labelledby', 'landmark-title');
  dialog.innerHTML = `<header><h2 id="landmark-title" tabindex="-1"></h2><button class="icon-button" aria-label="Close geology exhibit">×</button></header>
    <p>Fictional training site</p><p data-history></p>
    <figure><img><figcaption></figcaption></figure>
    <p><a target="_blank" rel="noopener noreferrer">Historical source</a></p>
    <p data-specimen-status role="status"></p>
    <div class="campaign-actions"><button class="action" data-sample></button><button class="radio-action" data-continue>Continue exploring</button></div>
    <p>Dock to deliver specimens. Use Play to resume driving.</p>`;
  host.append(dialog);
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
  const image = q<HTMLImageElement>('img');
  const sample = q<HTMLButtonElement>('[data-sample]');
  const proceed = q<HTMLButtonElement>('[data-continue]');
  let site: LandmarkId;
  let caller: HTMLElement | null;
  function refresh() {
    const phase = getState().campaign.rover.specimens[site];
    sample.hidden = phase !== 'visited';
    q('[data-specimen-status]').textContent = phase === 'aboard' ? 'Specimen aboard the rover.' : phase === 'delivered' ? 'Specimen logged at the outpost.' : '';
  }
  image.onerror = () => { image.hidden = true; };
  sample.onclick = () => {
    const error = collectSpecimen(getState(), site);
    if (error) { q('[data-specimen-status]').textContent = error; return; }
    refresh();
    changed();
    proceed.focus();
  };
  q('.icon-button').onclick = proceed.onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    (caller && caller !== document.body && caller.getClientRects().length ? caller : fallbackFocus).focus();
  });
  return {
    show(id: LandmarkId, trigger?: HTMLElement) {
      if (document.querySelector('dialog[open]') || visitLandmark(getState(), id)) return;
      site = id;
      caller = trigger ?? (document.activeElement as HTMLElement | null);
      pause();
      const spec = lunarLandmarks[id];
      const title = q('#landmark-title');
      title.textContent = spec.name;
      q('[data-history]').textContent = spec.history;
      image.hidden = false;
      image.alt = spec.alt;
      image.src = spec.photo;
      q('figcaption').textContent = spec.caption;
      q<HTMLAnchorElement>('a').href = spec.source;
      sample.textContent = `Collect sample · ${spec.sample}`;
      refresh();
      dialog.showModal();
      dialog.scrollTop = 0;
      title.focus();
    },
  };
}
