export function mountMotionPreference() {
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector<HTMLButtonElement>('#reduce-motion')!;
  const key = 'lunar-reduced-motion';
  let manual = false;
  try { manual = localStorage.getItem(key) === 'true'; } catch { /* Preferences are optional. */ }
  const changes = new EventTarget();
  const update = () => {
    const enabled = manual || query.matches;
    document.documentElement.classList.toggle('reduce-motion', enabled);
    button.setAttribute('aria-pressed', String(enabled));
    button.disabled = query.matches;
    button.textContent = query.matches ? 'Reduce motion (device)' : 'Reduce motion';
    changes.dispatchEvent(new Event('change'));
  };
  button.addEventListener('click', () => {
    manual = !manual;
    try { localStorage.setItem(key, String(manual)); } catch { /* Keep this session's choice. */ }
    update();
  });
  query.addEventListener('change', update);
  update();
  return { get reduced() { return manual || query.matches; }, changes };
}

export type MotionPreference = ReturnType<typeof mountMotionPreference>;
