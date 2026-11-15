import { buildings, type Building } from '../data/buildings';

const surfaceTargets = { rover: 'Rover dock', departure: 'Departure' } as const;
export type SurfacePanel = keyof typeof surfaceTargets;

export function mountBuildingControls(
  onSelect: (building: Building, trigger: HTMLButtonElement) => void,
  onSurface: (panel: SurfacePanel, trigger: HTMLButtonElement) => void,
) {
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
      button.addEventListener('click', () => onSelect(building, button));
      return button;
    }
    const marker = markers[building.id] = makeButton(building.name, 'map-marker');
    marker.dataset.facility = building.id;
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
  const surfaceMarkers = {} as Record<SurfacePanel, HTMLButtonElement>;
  for (const panel of Object.keys(surfaceTargets) as SurfacePanel[]) {
    const marker = surfaceMarkers[panel] = document.createElement('button');
    marker.className = 'map-marker surface-marker';
    marker.hidden = true;
    marker.type = 'button';
    marker.dataset.surface = panel;
    marker.textContent = surfaceTargets[panel];
    marker.setAttribute('aria-controls', `campaign-${panel}`);
    marker.setAttribute('aria-expanded', 'false');
    marker.onclick = () => onSurface(panel, marker);
    controls.append(marker);
  }
  return {
    markers, surfaceMarkers, tabs,
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
