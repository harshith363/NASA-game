# Junior Astronaut Mission Trainer — Game overview

Junior Astronaut Mission Trainer is a browser-based spaceflight and lunar survival game. The player guides a five-person crew from Earth to the Moon and manages a small outpost through two simulated solar particle storms. The campaign continues with staffed facilities, lunar rover expeditions, and a playable return to Earth after 15 full mission days.

This overview describes the current playable game. Some older project documents describe the former daily-turn prototype.

## How to play

From the chapter menu, start or resume the **Earth-to-Moon flight**, or select **Go directly to outpost** to skip flight. After touchdown, **Enter lunar outpost** opens Day 1 with standard supplies for that flight. The button is also available from the chapter menu when a saved flight has already landed. Once the surface run has a save, the menu resumes it. The direct-outpost save remains available separately. The menu offers **Resume return flight** or **View final debrief** when a run reaches those stages. **New outpost** resets only the active outpost save.

### Earth-to-Moon flight

The flight begins on the launchpad. Connect ground power, start avionics and life support, load and confirm the approved navigation route, switch to onboard power, and request clearance. Authorizing launch starts a countdown. The flight proceeds through ascent, Earth orbit, and a departure burn.

Two incidents put reserves under pressure. A cooling warning offers a choice between running the backup pump and spending more fuel on backup thrusters. An oxygen supply leak must first be isolated, after which the player can power a repair tool or use a reserve bypass. The flight console shows expected resource costs before committing a command. The route view and exterior camera show the mission stage.

The final stretch includes lunar braking, a landing checklist, powered descent and touchdown. The landing screen shows the remaining flight resources and offers **Enter lunar outpost** directly. Checkpoint retry lets the player revisit a decision. The flight settings menu includes pause, sound, and reduced motion.

### Timed lunar outpost

The outpost starts paused. At 1×, one mission day passes in 60 real seconds. The clock has a play/pause button and a speed button that cycles through **1×, 2×, and 4×**. Switching browser tabs pauses the run. The HUD shows battery, food, water, oxygen, and construction materials. Falling resources are red, and rising resources are green.

| Current control | What it does |
| --- | --- |
| Farm | Switch greenhouse lighting and water recycling on or off. |
| Mission Control Tower | Manage shelter and reserve oxygen, or select **Request telemetry** for five simulated readings and ten NASA/NOAA readings when available. |
| Communications Centre | Request a storm forecast or assign a tower radar survey to reveal nearby caches. |
| Build | Choose an available plot and spend materials on a facility. Select an occupied plot to inspect it or toggle a completed facility. |

There are six construction plots and 100 starting materials. Two available astronauts travel to the active plot and process the queue in order. Construction pauses during crew recall and storms.

| Facility | Cost | Build time | Effect when online |
| --- | ---: | ---: | --- |
| Solar array | 25 materials | 0.58 days | Generates 5 power per day in clear conditions. Output falls during the storm. |
| Battery bank | 20 materials | 0.42 days | Adds 20 units of empty storage capacity. |
| Greenhouse | 35 materials | 0.83 days | Produces 3 food per day with lights, power, and water. Uses 2 power and 0.5 water per day. |

A typical run starts with a solar array and greenhouse. By default the first warning comes on **Day 4**, with a storm from **Day 5 to Day 7**. A second storm runs from Day 11.50 to Day 12.50. Warning, arrival, and clearance pause the clock. Recall early enough for each astronaut to get inside. Exposure during a storm or exhaustion of food, water, or oxygen interrupts the mission. Running out of battery triggers an alert and puts the crew on stored oxygen.

### The crew

The five specialists are **Aya Chen** (power engineering), **Mateo Silva** (life support), **Imani Okafor** (botany), **Leena Rao** (crew safety), and **Noah Reyes** (communications). Assign each astronaut to a facility job from its panel. Jobs take time, including travel to the station, and can improve power generation or earn extra food, water, or materials. Leena can inspect the shelter for earlier warnings, and Noah can survey for supplies. The scene and roster show individual positions, including who is still returning to shelter or away in the rover.

### Lunar rover and historical exhibit

Open Rover, assign an available driver, and steer with WASD, arrow keys, or on-screen buttons. Driving runs at 1×. Park and leave the driving view to restore fast-forward. Acceleration and steering are continuous. Crater slopes and rough ground affect speed, traction, energy use, and wheel suspension. The route display shows bearing, distance, and estimated charge to return. Find four caches across the expanded map with a Communications survey or a rover radar sweep. Bring loaded cargo back to the dock to bank it. Charge from base power at the dock, or request a timed recovery if the rover is stranded.

The Apollo 12 and Surveyor 3 overlook unlocks a short history exhibit. Its setting and the nearby recoverable supplies are fictional. The exhibit links to [NASA’s Apollo 12 mission history](https://www.nasa.gov/missions/apollo/apollo-12-the-pinpoint-mission/).

### Departure and splashdown

After **15 full mission days**, use Departure to check the crew, dock the rover, and load ship reserves. If the checklist is incomplete, the surface mission can continue. Boarding opens a playable return flight with lunar liftoff, an Earth transfer burn, reentry alignment, parachute deployment, and ocean splashdown. The return shares the outbound layout, trajectory map, and 3D camera. The debrief reports crew recovery, mission duration, materials delivered, and the historic site visit. It assigns a score out of 100 for survival and return, outpost reserves, sustainable operations, and exploration. A lost run opens a centered explanation and retry dialog. See the [outpost guide](TIMED_OUTPOST.md#depart-and-score-the-mission) for the rubric.

## Science, visuals, and access

- The flight includes locally bundled ISS cabin CO₂ readings and an Artemis II trajectory comparison. These are attributed reference material. Gameplay telemetry, resource units, time compression, and storm timing are simulated.
- The particle drill was inspired by an archived NASA DONKI observation. The Communications Centre provides an animated in-game forecast response and a **Request telemetry** button. Simulated readings carry a visible badge. The Control Tower’s on-demand report lists current mission readings separately from external data, with source and UTC timestamp labels. See the [telemetry reference](TELEMETRY.md) for all 15 readings and fallback behavior.
- Three.js renders the spacecraft, rocky terrain, outpost, and astronauts. The outpost can fall back to a static map without WebGL. Settings and fullscreen share a compact icon pill in both chapters, and motion can be reduced.
- See the [asset and data register](ASSET_REGISTER.md) for source credits and the [flight validation notes](EARTH_TO_MOON_VALIDATION.md) for evidence processing and checks.

## Project structure and local development

The game runs in a TypeScript client bundled by Vite. An optional server endpoint aggregates public telemetry feeds. The main entry point starts the flight menu and hands off to the outpost scene. The mission rules and saves are separate from the UI and rendering.

| Path | Responsibility |
| --- | --- |
| [`src/main.ts`](../src/main.ts) | Entry point and flight-to-outpost handoff. |
| [`src/mission/`](../src/mission/) | Flight commands and journal replay, timed outpost rules and save validation, and legacy daily rules. |
| [`src/ui/`](../src/ui/) | Chapter menu, flight console, outpost HUD, facility panels, preferences, and scientific references. |
| [`src/server/`](../src/server/) and [`netlify/functions/`](../netlify/functions/) | External telemetry aggregation and the hosted HTTP entry point. |
| [`src/scenes/`](../src/scenes/) | Three.js scenes, procedural models, terrain, and static outpost fallback. |
| [`src/data/`](../src/data/) | Crew, facilities, flight scenario, and bundled reference data. |
| [`src/audio/`](../src/audio/) and [`public/`](../public/) | Mission audio, portraits, and illustrations. |
| [`tests/`](../tests/) | Flight, outpost, storm, rover, save, telemetry parsing, and legacy crew-operation checks. |

Use Node.js **22.12 or newer**.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Open the address printed by Vite. `npm run build` type-checks the app and writes the static output to `dist/`, which is also the configured Netlify publish directory. Vite and the Netlify function serve external telemetry through the same route. Mission readings remain available if upstream feeds fail. Flight progress and outpost progress are saved in browser storage. The outpost resumes paused and does not advance offline. Legacy daily journals remain separate from the timed save.

See the [campaign phases](LUNAR_CAMPAIGN_PHASED_PLAN.md) for the design, the [timed outpost guide](TIMED_OUTPOST.md) for surface rules, and [campaign validation](CAMPAIGN_VALIDATION.md) for current test results.
