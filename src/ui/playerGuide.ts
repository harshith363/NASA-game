export interface PlayerGuide {
  id: string;
  title: string;
  cards: readonly { title: string; instructions: readonly string[]; target?: string }[];
}

interface GuideOffer { title: string; description: string }

export function mountPlayerGuide(host: HTMLElement, id: string, steps?: {
  enter: (guide: PlayerGuide, index: number) => string | void;
  close: (guide: PlayerGuide) => void;
}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'console mission-dialog player-guide';
  dialog.setAttribute('aria-labelledby', `${id}-title`);
  dialog.innerHTML = `
    <header><h2 id="${id}-title"></h2><button type="button" class="icon-button" aria-label="Close guide">×</button></header>
    <p data-guide-progress></p>
    <p data-guide-offer></p>
    <h3 tabindex="-1" aria-describedby="${id}-instructions"></h3>
    <ol id="${id}-instructions"></ol>
    <footer class="campaign-actions">
      <button type="button" class="radio-action" data-guide-back>Back</button>
      <button type="button" class="action" data-guide-next>Next</button>
    </footer>`;
  host.append(dialog);
  const title = dialog.querySelector('h2')!;
  const cardTitle = dialog.querySelector('h3')!;
  const instructions = dialog.querySelector('ol')!;
  const progress = dialog.querySelector<HTMLElement>('[data-guide-progress]')!;
  const offerDetail = dialog.querySelector<HTMLElement>('[data-guide-offer]')!;
  const back = dialog.querySelector<HTMLButtonElement>('[data-guide-back]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-guide-next]')!;
  let guide: PlayerGuide;
  let card = 0;
  let caller: HTMLElement | undefined;
  let target: HTMLElement | null = null;
  let layoutFrame = 0;
  let initialScroll: { x: number; y: number } | undefined;
  let offer: GuideOffer | undefined;
  const shown = new Set<string>();

  function pointAtControl() {
    target?.classList.remove('guide-highlight');
    const selector = offer ? undefined : steps?.enter(guide, card) ?? guide.cards[card].target;
    target = selector ? document.querySelector<HTMLElement>(selector) : null;
    dialog.classList.toggle('player-guide-anchored', !!target);
    if (!target) return;
    target.classList.add('guide-highlight');
    const rect = target.getBoundingClientRect();
    const panel = target.closest('.sim-facility-panel, .sim-build')?.getBoundingClientRect();
    const top = Math.max(12, panel?.top ?? 0);
    const bottom = Math.min(innerHeight - 12, panel?.bottom ?? innerHeight);
    if (rect.top < top || rect.bottom > bottom) target.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  function placeBesideControl() {
    if (!dialog.open || !target) return;
    const bounds = target.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const margin = 12;
    const gap = 14;
    const cardWidth = Math.min(400, width - margin * 2);
    const fitsRight = bounds.right + gap + cardWidth <= width - margin;
    const fitsLeft = bounds.left - gap - cardWidth >= margin;
    const spaceAbove = bounds.top - gap - margin;
    const spaceBelow = height - bounds.bottom - gap - margin;
    const beside = fitsRight || fitsLeft;
    const below = spaceBelow >= spaceAbove;
    const availableHeight = beside ? height - margin * 2 : Math.max(spaceAbove, spaceBelow);
    const set = (property: string, value: number) => {
      const pixels = `${Math.round(value)}px`;
      if (dialog.style.getPropertyValue(property) !== pixels) dialog.style.setProperty(property, pixels);
    };
    set('--guide-width', cardWidth);
    set('--guide-height', availableHeight);
    const cardHeight = dialog.offsetHeight;
    const clamp = (value: number, limit: number) => Math.max(margin, Math.min(value, limit - margin));
    const left = fitsRight ? bounds.right + gap : fitsLeft ? bounds.left - gap - cardWidth
      : (bounds.left + bounds.right - cardWidth) / 2;
    const top = beside ? (bounds.top + bounds.bottom - cardHeight) / 2
      : below ? bounds.bottom + gap : bounds.top - gap - cardHeight;
    set('--guide-left', clamp(left, width - cardWidth));
    set('--guide-top', clamp(top, height - cardHeight));
    // The scene can move map markers while the guide is open.
    layoutFrame = requestAnimationFrame(placeBesideControl);
  }

  function render() {
    const current = guide.cards[card];
    const single = guide.cards.length === 1;
    title.textContent = offer?.title ?? guide.title;
    offerDetail.hidden = !offer;
    offerDetail.textContent = offer?.description ?? '';
    cardTitle.hidden = !!offer || single;
    cardTitle.textContent = current.title;
    progress.hidden = !!offer || single;
    progress.textContent = `Step ${card + 1} of ${guide.cards.length}`;
    instructions.hidden = !!offer;
    instructions.replaceChildren(...current.instructions.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    back.hidden = !offer && card === 0;
    back.textContent = offer ? 'Not now' : 'Back';
    next.textContent = offer ? 'Start walkthrough' : card === guide.cards.length - 1 ? 'Done' : 'Next';
  }
  function move(step: number) {
    card = step;
    render();
    cancelAnimationFrame(layoutFrame);
    pointAtControl();
    placeBesideControl();
    dialog.scrollTop = 0;
    cardTitle.focus({ preventScroll: true });
  }
  function markSeen() {
    shown.add(guide.id);
    try { localStorage.setItem(`lunar-guide-v1/${guide.id}`, 'seen'); } catch { /* The guide still works in this session. */ }
  }
  function show(content: PlayerGuide, trigger: HTMLElement, invitation?: GuideOffer) {
    if (document.querySelector('dialog[open]')) return false;
    guide = content;
    caller = trigger;
    offer = invitation;
    card = 0;
    initialScroll = guide.cards.some(step => step.target) ? { x: window.scrollX, y: window.scrollY } : undefined;
    render();
    dialog.showModal();
    pointAtControl();
    placeBesideControl();
    dialog.scrollTop = 0;
    (offer || guide.cards.length === 1 ? next : cardTitle).focus({ preventScroll: true });
    if (!offer) markSeen();
    return true;
  }
  dialog.querySelector<HTMLButtonElement>('.icon-button')!.onclick = () => dialog.close();
  back.onclick = () => { if (offer) dialog.close(); else move(card - 1); };
  next.onclick = () => {
    if (offer) {
      offer = undefined;
      markSeen();
      move(0);
    } else if (card === guide.cards.length - 1) dialog.close();
    else move(card + 1);
  };
  dialog.addEventListener('close', () => {
    cancelAnimationFrame(layoutFrame);
    target?.classList.remove('guide-highlight');
    target = null;
    if (!offer) steps?.close(guide);
    if (initialScroll) window.scrollTo({ left: initialScroll.x, top: initialScroll.y, behavior: 'instant' });
    if (caller?.isConnected) caller.focus({ preventScroll: true });
  });
  return {
    get open() { return dialog.open; },
    show,
    showOnce(content: PlayerGuide, trigger: HTMLElement) {
      if (shown.has(content.id)) return;
      try { if (localStorage.getItem(`lunar-guide-v1/${content.id}`)) return; } catch { /* Use the session state. */ }
      show(content, trigger);
    },
  };
}
