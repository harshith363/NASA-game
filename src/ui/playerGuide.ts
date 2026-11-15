import { mountGuideSpotlight } from './guideSpotlight';

export interface PlayerGuide {
  id: string;
  title: string;
  cards: readonly { title: string; instructions: readonly string[]; target?: string }[];
}

interface GuideOffer { title: string; description: string; actionLabel?: string; start?: () => void }

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
  const spotlight = mountGuideSpotlight(host, dialog);
  let afterClose: (() => void) | undefined;
  let initialScroll: { x: number; y: number } | undefined;
  let offer: GuideOffer | undefined;
  const shown = new Set<string>();

  function pointAtControl() {
    const selector = offer ? undefined : steps?.enter(guide, card) ?? guide.cards[card].target;
    spotlight.pointAt(selector ? document.querySelector<HTMLElement>(selector) : null);
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
    next.textContent = offer ? offer.actionLabel ?? 'Start walkthrough' : card === guide.cards.length - 1 ? 'Done' : 'Next';
  }
  function move(step: number) {
    card = step;
    render();
    pointAtControl();
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
    dialog.scrollTop = 0;
    (offer || guide.cards.length === 1 ? next : cardTitle).focus({ preventScroll: true });
    if (!offer) markSeen();
    return true;
  }
  dialog.querySelector<HTMLButtonElement>('.icon-button')!.onclick = () => dialog.close();
  back.onclick = () => { if (offer) dialog.close(); else move(card - 1); };
  next.onclick = () => {
    if (offer?.start) {
      afterClose = offer.start;
      dialog.close();
    } else if (offer) {
      offer = undefined;
      markSeen();
      move(0);
    } else if (card === guide.cards.length - 1) dialog.close();
    else move(card + 1);
  };
  dialog.addEventListener('close', () => {
    spotlight.clear();
    if (!offer) steps?.close(guide);
    if (initialScroll) window.scrollTo({ left: initialScroll.x, top: initialScroll.y, behavior: 'instant' });
    if (caller?.isConnected) caller.focus({ preventScroll: true });
    const resume = afterClose;
    afterClose = undefined;
    resume?.();
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
