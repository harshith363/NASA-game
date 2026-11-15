import { missionScore, type OutpostState } from '../mission/outpostSimulation';

export function renderMissionScore(host: HTMLElement, state: OutpostState) {
  const score = missionScore(state);
  const heading = document.createElement('h3');
  heading.textContent = `${score.total}/100 · ${score.rating}`;
  const progress = document.createElement('progress');
  progress.max = 100;
  progress.value = score.total;
  progress.setAttribute('aria-label', 'Mission performance');
  const list = document.createElement('dl');
  list.className = 'mission-score-breakdown';
  for (const category of score.categories) {
    const label = document.createElement('dt');
    label.textContent = category.label;
    const points = document.createElement('dd');
    points.textContent = `${category.points}/${category.max}`;
    const detail = document.createElement('dd');
    detail.className = 'score-detail';
    detail.textContent = category.detail;
    list.append(label, points, detail);
  }
  host.replaceChildren(heading, progress, list);
}

export function mountMissionDialog(host: HTMLElement, restart: () => void, dismiss: () => void) {
  const dialog = document.createElement('dialog');
  dialog.className = 'console mission-dialog';
  dialog.setAttribute('aria-labelledby', 'mission-dialog-title');
  dialog.setAttribute('aria-describedby', 'mission-dialog-detail');
  dialog.innerHTML = `<p class="eyebrow">Lunar outpost</p><h2 id="mission-dialog-title"></h2>
    <p id="mission-dialog-detail"></p><div class="mission-score"></div>
    <form method="dialog" class="campaign-actions">
      <button class="radio-action" value="cancel" autofocus>Cancel</button>
      <button class="action" value="restart">Start new outpost</button>
    </form>`;
  host.append(dialog);
  const heading = dialog.querySelector('#mission-dialog-title')!;
  const detail = dialog.querySelector('#mission-dialog-detail')!;
  const score = dialog.querySelector<HTMLElement>('.mission-score')!;
  const cancel = dialog.querySelector('button[value="cancel"]')!;
  dialog.addEventListener('close', () => { if (dialog.returnValue === 'restart') restart(); else dismiss(); });
  return {
    show(state: OutpostState | undefined) {
      if (dialog.open) return;
      dialog.returnValue = '';
      heading.textContent = state ? 'Mission lost' : 'Start a new outpost?';
      detail.textContent = state
        ? `${state.message} Start a new outpost to try again.`
        : 'Starting over will replace your current outpost save.';
      score.hidden = !state;
      if (state) renderMissionScore(score, state);
      cancel.textContent = state ? 'Review outpost' : 'Cancel';
      dialog.showModal();
    },
  };
}
