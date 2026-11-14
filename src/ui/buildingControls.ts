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
      button.setAttribute('aria-controls', `${building.id}-panel`);
      button.style.setProperty('--facility-color', `#${building.color.toString(16)}`);
      button.addEventListener('click', () => onSelect(building));
      return button;
    }
    const marker = markers[building.id] = makeButton(building.name, 'map-marker');
    const markerLabel = document.createElement('span');
    markerLabel.className = 'marker-label';
    const status = document.createElement('small');
    status.className = 'marker-status';
    const assigned = document.createElement('span');
    assigned.className = 'marker-crew';
    markerLabel.append(building.id === 'control' ? 'Control Tower' : building.name, status, assigned);
    marker.replaceChildren(markerLabel);
    marker.setAttribute('aria-expanded', 'false');
    controls.append(marker);
    const tab = tabs[building.id] = makeButton(building.id === 'comms' ? 'Comms' : building.id === 'control' ? 'Tower' : building.name, 'facility-tab');
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

    },
    showCrew(id: Building['id'], names: string[]) {
      const label = markers[id].querySelector<HTMLElement>('.marker-crew')!;
      label.textContent = names.length ? `Planned · ${names.join(', ')}` : '';
    },
    status(id: Building['id'], label: string) {
      markers[id].querySelector('small')!.textContent = label;
      markers[id].setAttribute('aria-label', `${buildings.find(building => building.id === id)!.name}, ${label}`);
    },
    enable(enabled: boolean) {
      controls.inert = !enabled;
      if (!enabled) for (const marker of Object.values(markers)) marker.querySelector('.marker-crew')!.textContent = '';
    },
  };
}
