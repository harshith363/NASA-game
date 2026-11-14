import { mountOutpost } from './scenes/OutpostScene';
import { mountBuildingControls } from './ui/buildingControls';
import { mountMission } from './ui/missionControls';
import { mountFlightIntro } from './ui/flightIntro';
import { mountMissionAudio } from './audio/missionAudio';
import type { PresentMissionEvent } from './mission/solarStorm';
import './styles.css';

const navigation = mountBuildingControls((building) => mission.openBuilding(building));
const outpost = mountOutpost(
  document.querySelector<HTMLElement>('#outpost-canvas')!,
  navigation.markers,
  (building) => mission.openBuilding(building),
);
const audio = mountMissionAudio();
const present: PresentMissionEvent = (event) => {
  outpost.present(event);
  audio.present(event);
};
const mission = mountMission(navigation, outpost.select, present);
mountFlightIntro(outpost.ready, present, audio.start, mission.enter);

const fullscreen = document.querySelector<HTMLButtonElement>('#fullscreen')!;
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    fullscreen.hidden = true;
  }
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
  fullscreen.title = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
});
