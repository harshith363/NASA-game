export function mountGuideSpotlight(host: HTMLElement, card: HTMLElement, widthLimit = 400) {
  const arrow = document.createElement('span');
  arrow.className = 'guide-arrow';
  if (card.classList.contains('training-coach')) arrow.classList.add('training-arrow');
  arrow.textContent = '➜';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.hidden = true;
  host.append(arrow);
  let target: HTMLElement | null = null;
  let frame = 0;

  function clear() {
    cancelAnimationFrame(frame);
    target?.classList.remove('guide-highlight');
    target = null;
    arrow.hidden = true;
    card.classList.remove('guide-anchored');
  }
  function position() {
    if (!target?.isConnected || !target.getClientRects().length) { clear(); return; }
    const bounds = target.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const margin = 12;
    const gap = 28;
    const cardWidth = Math.min(widthLimit, width - margin * 2);
    const fitsRight = bounds.right + gap + cardWidth <= width - margin;
    const fitsLeft = bounds.left - gap - cardWidth >= margin;
    const spaceAbove = bounds.top - gap - margin;
    const spaceBelow = height - bounds.bottom - gap - margin;
    const beside = fitsRight || fitsLeft;
    const below = spaceBelow >= spaceAbove;
    const availableHeight = beside ? height - margin * 2 : Math.max(spaceAbove, spaceBelow);
    const set = (node: HTMLElement, property: string, value: number, unit = 'px') => {
      const formatted = `${Math.round(value)}${unit}`;
      if (node.style.getPropertyValue(property) !== formatted) node.style.setProperty(property, formatted);
    };
    const clamp = (value: number, limit: number) => Math.max(margin, Math.min(value, limit - margin));
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    set(card, '--guide-width', cardWidth);
    set(card, '--guide-height', availableHeight);
    const cardHeight = card.offsetHeight;
    const left = fitsRight ? bounds.right + gap : fitsLeft ? bounds.left - gap - cardWidth : centerX - cardWidth / 2;
    const top = beside ? centerY - cardHeight / 2 : below ? bounds.bottom + gap : bounds.top - gap - cardHeight;
    set(card, '--guide-left', clamp(left, width - cardWidth));
    set(card, '--guide-top', clamp(top, height - cardHeight));
    set(arrow, 'left', clamp(fitsRight ? bounds.right + 14 : fitsLeft ? bounds.left - 14 : centerX, width));
    set(arrow, 'top', clamp(beside ? centerY : below ? bounds.bottom + 14 : bounds.top - 14, height));
    set(arrow, '--guide-arrow-angle', fitsRight ? 180 : fitsLeft ? 0 : below ? -90 : 90, 'deg');
    frame = requestAnimationFrame(position);
  }
  function pointAt(control: HTMLElement | null) {
    if (control === target) return;
    clear();
    if (!control?.getClientRects().length) return;
    target = control;
    target.classList.add('guide-highlight');
    const rect = target.getBoundingClientRect();
    const panel = target.closest('.sim-facility-panel, .sim-build')?.getBoundingClientRect();
    if (rect.top < Math.max(12, panel?.top ?? 0) || rect.bottom > Math.min(innerHeight - 12, panel?.bottom ?? innerHeight)) {
      target.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    card.classList.add('guide-anchored');
    arrow.hidden = false;
    position();
  }
  return { pointAt, clear };
}
