export function resourceChange(label: string, before: number, after: number) {
  const item = document.createElement('span');
  const delta = after - before;
  item.className = 'resource-change';
  item.dataset.change = delta > 0 ? 'gain' : delta < 0 ? 'loss' : 'steady';
  item.textContent = `${label ? label + ' ' : ''}${before} → ${after} (${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta)})`;
  return item;
}
