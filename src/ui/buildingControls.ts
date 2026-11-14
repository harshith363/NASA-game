import { buildings, type Building } from '../data/buildings';

export function mountBuildingControls(onSelect: (building: Building) => void) {
  const controls = document.querySelector<HTMLElement>('#building-controls')!;
  const navigation = document.querySelector<HTMLElement>('#facility-tabs')!;
  const markers = {} as Record<Building['id'], HTMLButtonElement>;
  const tabs = {} as typeof markers;

  for (const building of buildings) {
    function makeButton(label: string, className: string) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = className;
      button.textContent = label;
      button.setAttribute('aria-controls', 'facility');
      button.style.setProperty('--facility-color', `#${building.color.toString(16)}`);
      button.addEventListener('click', () => onSelect(building));
      return button;
    }
    const marker = markers[building.id] = makeButton(building.name, 'map-marker');
    marker.setAttribute('aria-expanded', 'false');
    controls.append(marker);
    const tab = tabs[building.id] = makeButton(building.id === 'comms' ? 'Comms' : building.name, 'facility-tab');
    tab.setAttribute('aria-label', building.name);
    tab.setAttribute('aria-expanded', 'false');
    navigation.append(tab);
  }
  return {
    markers, tabs,
    select(id?: Building['id']) {
      for (const building of buildings) {
        const active = String(building.id === id);
        markers[building.id].setAttribute('aria-expanded', active);
        tabs[building.id].setAttribute('aria-expanded', active);
      }
      controls.classList.toggle('panel-open', Boolean(id));
    },
    enable(enabled: boolean) { controls.inert = !enabled; },
  };
}
