# Junior Astronaut Mission Trainer

First prototype implementation plan for the NASA Space Apps challenge. A small crew arrives at a lunar outpost and runs its first emergency drill. The player learns how one power budget connects crew safety and tomorrow’s food supply. Target audience is ages 7–12. Target play time is 3–5 minutes, including a skippable opening. [Challenge objectives](https://hackathlone.com/challenges/junior-astronaut-mission-trainer#objectives)

## Current build and technical baseline

- **Completed** — Phase 0 established the browser scaffold. Phase 1 added the playable two-shift storm drill, allocation previews, mission outcomes, and retry. The 3D redesign moved the drill into a viewport-filling lunar base with an angled overhead camera, selectable buildings, animated resource bars, and an overlay debrief.
- **Stack** — Three.js renders the terrain, buildings, lighting, and animation. HTML/CSS provide keyboard-accessible map markers, facility panels, and the HUD. TypeScript owns the mission rules, and Vite builds the static site.
- **Map and controls** — Players can select building meshes or labeled markers. The Farm controls grow lights. The Control Tower controls crew location and air mode. The Communications Centre shows the archived NASA observation alongside the simulated alert and forecast. Facility controls appear at the side on larger displays and near the bottom on phones. A static interactive map is implemented for browsers without WebGL.
- **Runtime** — The short drill keeps state in memory. Bundle mission data and media with the static build for play without an account, backend, or runtime NASA API call. Verify the release build under its intended URL prefix.

## Implemented player journey

1. **Arrival.** Choose sound or muted play over the live base scene. The lander descends, the crew walks to the habitat, and the tower announces rising particle readings. Skip and reduced motion reach the same warning state.
2. **Planning.** The Control Tower opens with the simulated alert and objectives. Players inspect facilities, request an optional forecast, and preview allocations.
3. **Two shifts.** Committing moves the crew and animates resource allocation. Rising and Peak have distinct air-system demand. Results remain visible before the next decision.
4. **Recovery and debrief.** Protected crews return to the habitat with the available harvest. The debrief distinguishes secured or delayed harvest from interrupted training and offers a scenario choice on retry.

## Implemented mission rules

The first scenario starts with 11 battery and 3 air. The shelter costs 1 power per shift. Normal air costs 2 power and reserve air costs 1 power plus 2 air. Peak adds 1 power to either air mode and 1 additional air to reserve mode. Lights off, dim, and full cost 0, 1, and 3 power and add 0, 1, and 2 harvest points respectively. The target is 3 points. Exposure or an empty air reserve interrupts training. The alternate scenario starts with 10 battery.

Previews and committed results share the same rules. See the [validation record](docs/PROTOTYPE_VALIDATION.md) for tested strategies and outstanding player and device checks.

## Real data and how it reaches the game

| Source | Planned use | What the source supports |
| --- | --- | --- |
| NASA CCMC DONKI | Bundle event `2024-05-11T04:07:00-SEP-001`, version 1. Show the observed timestamp, STEREO-A spacecraft, and an archive link in the radio details. Let the event drive the trigger and provenance text. | The event was detected at 04:07 UTC on May 11, 2024, by STEREO-A. The spacecraft measurement supplies the historical context. Shift length, forecast, location of the fictional crew, and exposure outcomes belong to the training scenario. [NASA archive entry](https://ccmc.gsfc.nasa.gov/DONKI/events/30717/1/) · [NASA notification](https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/Alert/30728/1) |
| NASA lunar radiation research | Explain in the debrief that mass between the crew and incoming particles offers protection. Draw a thicker-walled shelter and use protected/exposed status. | NASA describes storm shelter concepts and lunar soil as a potential shielding material. Quantitative dose and attenuation would require location, event spectrum, and shielding information. [NASA lunar radiation protection](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/) |
| NASA Moon light travel time | Define the radio travel component as 1.3 seconds one way and about 2.6 seconds round trip. Give the player useful actions during the wait. | The distance explains the brief lunar delay. Any additional forecast processing time is a gameplay assumption. [NASA light travel time](https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-does-webb-see-back-in-time/) |
| NASA ECLSS and Veggie | Explain the functions of air circulation and atmospheric control, and why grow lights use power to support a later harvest. Use the Canadian Space Agency lesson as a reference for age-appropriate framing. | ECLSS and Veggie describe systems demonstrated on the ISS. The lunar outpost’s power costs and crop points are game balance values. [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) · [NASA Veggie](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/) · [CSA food toolkit](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/) |
| NASA Moon Trek | Optional terrain reference during art production. If used, record the layer and dataset credit, and describe the outpost as fictional. | Lunar maps and layers for imagery, elevation, slope, and lighting. Mars Trek is useful for a future Mars scenario. [NASA Moon Trek](https://trek.nasa.gov/moon/jpl/config/textAbout.html) |

**Import and attribution.** NASA documents the current public DONKI base at `https://ccmc.gsfc.nasa.gov/DONKI-API/get/`. Try the `SEP` endpoint with `startDate=2024-05-11` and `endDate=2024-05-12`, select the matching activity ID, and confirm the record against NASA’s notification. The event is verified from NASA’s archive material. The raw JSON GET couldn’t be verified from this workspace. If the endpoint is inaccessible during implementation, manually transcribe the verified fields from NASA’s event and notification, record that method, and keep the source links. [CCMC API migration and schemas](https://ccmc.gsfc.nasa.gov/news/major-updates/#sep26)

Store `activityId`, `version`, `observedAtUtc`, `observer`, and `sourceUrl` in an archived event record, with retrieval date and acquisition method in the evidence notes. Validate the selected fields when importing data. Put the game trigger and mission values in separate mission config. The radio should say “Archive event: NASA spacecraft detected particles” and the debrief should say “Your mission outcomes are simulated.” Retain the official event link, the source date, and the analysis assumptions in the build. The shipped game uses only the checked-in snapshot and plays without fetching NASA data.

**Possible extensions.** OSDR can support a later crop study or crew health lesson. RadLab can provide instrument readings for a radiation explainer. For a location-specific lunar scenario, compare against a dataset with the relevant observing geometry, such as Chang’e 4 surface measurements for context, and retain the instrument and units. Adding that reference would still require a separate model to estimate dose inside this fictional habitat. [NASA OSDR](https://science.nasa.gov/biological-physical/data/osdr/) · [RadLab](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) · [Chang’e 4 surface measurements](https://pmc.ncbi.nlm.nih.gov/articles/PMC7518862/)

## Implementation phases

Phase 1 is complete. Phases 2 and 3 were implemented and subsequently updated by the prototype improvement work. Phase 4 remains open for facilitated playtesting and release preparation.

### Phase 2 — NASA data and radio · Implemented

- Add the archived DONKI record to the existing data layer. Use the Communications Centre panel to show the observed timestamp, spacecraft, and archive link next to a clearly labeled simulated alert. Add the source link and a short science explanation to the debrief.
- Add a **Request forecast** button to that panel. Show the reply in progress with about 2.6 seconds of round-trip signal travel and a separately labeled simulated analysis time. Let players use other buildings while waiting. The reply describes peak duration and air-system demand. The existing shift report provides the warning before shift two on either path.
- Allow one request per run. Keep a pending or received reply available when the panel is reopened. Clear any pending timer when the run ends or the player retries.

**Exit check.** Match the displayed fields against NASA's record. Verify one reply per run, panel switching while a reply is pending, and a clean retry. Complete the mission with external requests blocked.

### Phase 3 — Skippable opening and arrival · Implemented

The current opening uses the playable outpost for the landing, crew arrival, and tower alert. Sound choice, skip, reduced motion, keyboard focus, and the static map fallback are supported. Retry returns to the base with a fresh mission.

### Phase 4 — Playtest and release package · 2–4 hours

- Play through the balanced and harvest-focused strategies, overspending, exposure, air exhaustion, and retry. Check source attribution and simulated labels. Recheck the map and HUD on desktop and mobile, including building selection, readability, fullscreen, reduced motion, and the static fallback.
- Ask a fresh player to describe one choice and its consequence. Use the result to refine the onboarding or debrief. Prepare a short demo showing the NASA event, a facility decision, the HUD change, and the mission outcome.
- Build and smoke-test the static package under the intended hosting path. Prepare the playable build, demo walkthrough, and source notes for the hackathon submission.

**Exit check.** A fresh player completes a run and can explain a trade-off. The production build plays without a NASA connection, the debrief links to its evidence, and Retry starts a fresh drill.
