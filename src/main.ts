import { mountOutpost } from './scenes/OutpostScene';
import { mountBuildingControls } from './ui/buildingControls';
import { mountTimedOutpost } from './ui/outpostControls';
import { mountFlightIntro } from './ui/flightIntro';
import { mountMissionAudio } from './audio/missionAudio';
import type { PresentMissionEvent } from './mission/presentation';
import { mountMotionPreference } from './ui/motionPreference';
import './styles.css';

const motion = mountMotionPreference();

const audio = mountMissionAudio();
let mission: ReturnType<typeof mountTimedOutpost> | undefined;
let entered = false;
mountFlightIntro(audio, motion, async (saveKey, arrival, fromFlight) => {
  if (entered) return;
  entered = true;
  const navigation = mountBuildingControls(
    (building, trigger) => mission?.openBuilding(building, trigger),
    (panel, trigger) => mission?.openSurface(panel, trigger),
  );
  const outpost = mountOutpost(document.querySelector<HTMLElement>('#outpost-canvas')!, navigation.markers, navigation.surfaceMarkers, motion, plot => mission?.openExpansion(plot));
  const present: PresentMissionEvent = event => { outpost.present(event); audio.present(event); };
  mission = mountTimedOutpost(outpost.updateFacilities, audio.pause, saveKey, id => { outpost.select(id); navigation.select(id); }, motion);
  navigation.enable(true);
  await outpost.ready;
  document.querySelector<HTMLElement>('#mission-workspace')!.inert = false;
  if (arrival) present({ type: 'arrival' });
  mission.showWelcomeGuide(fromFlight);
});

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
