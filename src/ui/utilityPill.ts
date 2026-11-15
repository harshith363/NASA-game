/** Shared icon controls for flight and outpost. Keeps existing preference handlers. */
export function mountUtilityPill(host: HTMLElement, content: HTMLElement) {
  const pill = document.createElement('div'); pill.className = 'utility-pill';
  pill.innerHTML = `<details class="utility-settings"><summary aria-label="Settings" title="Settings"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/></svg></summary></details><button type="button" class="utility-fullscreen" aria-label="Enter fullscreen" title="Enter fullscreen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></svg></button>`;
  content.classList.add('utility-menu'); pill.querySelector('details')!.append(content);
  const fullscreen = pill.querySelector<HTMLButtonElement>('button.utility-fullscreen')!;
  fullscreen.hidden = !document.fullscreenEnabled;
  const sync = () => { const label = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'; fullscreen.title = label; fullscreen.setAttribute('aria-label', label); fullscreen.setAttribute('aria-pressed', String(!!document.fullscreenElement)); };
  fullscreen.onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { fullscreen.title = 'Fullscreen unavailable'; } sync(); };
  document.addEventListener('fullscreenchange', sync); sync(); host.append(pill);
}
