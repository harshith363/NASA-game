# Seven-day Lunar survival milestone

## Baseline

The starting prototype at commit `a551406` passed five rule tests and the production build. Its exact desktop and mobile layout can be reproduced from that commit. Chrome reference captures used a 1280 × 800 desktop viewport and a 360 × 640 phone viewport after skipping arrival. The captures show the initial Control Tower panel, angled lunar outpost, colored facilities, warm console accents, and separate resource telemetry.

Before the expansion, the build occupied about 8.1 MiB on disk, including about 6.8 MiB of audio and 376 KiB of images. The baseline JS bundle was 525.56 kB. A short 30-frame sample in headless Chrome with software WebGL measured about 8 fps at desktop size and 16 fps at phone size. Those readings describe the software-rendered test environment. Physical phone and hardware-backed rendering remain to be measured.

## Daily rules

The configuration and transition are in `src/mission/dailyMission.ts`. Essentials run before charging. The battery caps during charging, then optional recovery and lights draw from it. Insufficient optional power blocks the commit and gives an adjustment. Inadequate essential power, air, food, drinking water, or particle protection interrupts the run. A critical shortfall before charging still counts after the battery recharges.

| State | Daily rule |
| --- | --- |
| Battery | Starts at 10 or 7 with capacity 16. Daily scenario generation is 7, 8, 6, 5, 7, 8, 7. The outpost uses one baseline power plus chosen systems. |
| Reserve air | Starts at three. Normal supply uses two power. Reserve mode uses one power plus two reserve air. Peak adds one power and one reserve-air demand when using the tank. CO₂ removal stays powered in both modes. |
| Drinking water | The crew drinks one per day, which enters the wastewater pool in this simplified model. The recycler costs one power and returns up to two water, limited by available wastewater and storage capacity. Growing crops draw one more water. Day one uses the default recycler setting before that control is introduced on day two. |
| Food | Five-person crew starts with 12 game units and uses two per day before harvest. A mature crop adds four food for future turns. |
| Crop | Off, Low, and Full cost zero, one, and three power and produce zero, one, and two growth when watered. Six growth matures the crop and starts a fresh batch. |
| Particle risk | Warn on day two, rise on day three, peak on day four, ease on day five. Shelter walls supply shielding. Occupying the shelter adds one power for ventilation. |
| Readiness | To finish ready, keep the crew safe for seven days and retain at least four battery and two food. A safe run can finish below target. |

Station and Mars mode settings can own their environmental schedule and resource parameters when added. Phase 2 can add crew assignments to the daily plan, one main task per crew member, with task costs resolved before the daily result. The scheduled storm phase is derived from the reviewed day and mode configuration. Future variable schedules should be stored with the run.

The versioned save is a journal of committed plans with a run ID and report acknowledgement. Replay validates and reconstructs the seven-turn state, fixed event phase, and most recent report. The game saves before animation and checks run and turn identity before committing. Reload during animation resumes at the report. Draft changes and radio messages are session-local. Starting a new run explicitly replaces the record. A stale tab with an observed save change asks the player to reload.

## Verified strategies

Use shelter on days three and four. Keep the recycler on.

| Scenario | Grow lights by day | Air | Harvest | End reserves |
| --- | --- | --- | --- | --- |
| Standard | Low, Low, Low, Low, Low, Low, Off | Normal each day | Day 6 | 15 battery, 3 air, 2 food, 4 water |
| Low battery | Full, Full, Off, Off, Full, Off, Off | Reserve on day 3 and Normal on other days | Day 5 | 15 battery, 1 air, 2 food, 7 water |

## Science and verification

- The bundled DONKI observation records energetic particles detected by STEREO-A on 11 May 2024. The game uses it as historical context for the particle alert. The simulated days and hazard thresholds are authored training rules. [NASA DONKI record](https://ccmc.gsfc.nasa.gov/DONKI/events/30717/1/) · [NASA on shielding](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/)
- The generation schedule represents changing availability of sunlight at a fictional site. NASA describes the importance of terrain and Sun angle to illumination near the lunar south pole. [NASA lunar south pole environment](https://www.nasa.gov/reference/moonbase-environment/)
- The water, carbon dioxide, and crop mechanics use fictional quantities and timescales. NASA documents water recycling, CO₂ removal, and the role of crops as a fresh supplement. [NASA life support](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) · [NASA crop research](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/)
- The five baseline tests and six new rule tests pass, as does the production build. Vite still warns about a JS chunk over 500 kB.
- Chrome checks covered the full desktop run, duplicate submissions, reload during animation, report and debrief resume, alternate-scenario retry, delayed radio, mobile keyboard controls, corrupt-save recovery, reduced motion, static fallback, and interruption.
- Intended-age playtesting, physical-phone layout and frame rate, and listening on speakers or headphones remain pending. The seven-day values and pacing are initial playtest settings.


## Phase 2 crew and storm briefing

Each astronaut starts with four readiness and gets one main assignment per day. Rest restores two up to the limit. A task generally costs two readiness. Specialists spend one readiness in their main role. A specialist can still operate with lower readiness when Leena runs shelter checks. Outdoor jobs are unavailable while sheltering or during the particle rise and peak.

| Specialist | Effect |
| --- | --- |
| Aya Chen, power engineer | Inspect the controller to unlock repair. Aya repairs it in one shift. A backup needs two. The completed repair adds one power per future day. |
| Mateo Silva, life-support engineer | Tunes the recycler for zero extra power that day. A backup can reclaim up to one extra water, subject to the wastewater and storage limits. |
| Imani Okafor, botanist | Adds two crop progress with lights and water. A backup adds one. |
| Leena Rao, crew safety officer | Reduces everyone else’s daily task cost by one when she runs shelter checks. |
| Noah Reyes, communications specialist | Adds up to two upcoming forecasts to the daily report. A backup adds one. |

Save schema 2 journals the five assignments per day. Existing schema 1 saves replay with all five resting on historical turns, preserving their previous resource outcomes. New days start with Rest selected for everyone. Controller work takes effect on the day after repair.

The day-two warning opens the illustrated briefing. Players can reopen it during the alert, read dialogue based on their reserves, pause the visual, compare shelter options, and apply a plan on days three and four. Forecast comparisons made before the alert explicitly use current reserves. The report shows what happened to the crew, the battery, and the crop after the player commits.

The 15 rule tests and production build passed. Chrome verification covered a full seven-day run with all five specialists, controller inspection and repair, dialogue and projected choices, GIF pause, plan application, resume, retry, and migration from an unread schema 1 report. Narrow-screen checks covered Escape, reduced-motion text, and missing-poster recovery. Physical-device timing and intended-age playtesting are still pending. Vite still reports a bundle above 500 kB.

## Experience playtest — 14 November 2026

Played the guided seven-day mission in Chrome, assigning all five specialists and finishing with “Crew safe and outpost ready.” Verified draft retention between buildings, controller repair, Observatory, reload during resolution, report resume, historical timeline reports, and reduced-motion/static-map fallback with a legacy save. No browser page errors were reported.

The playtest led to these UI fixes:

- Facility and crew panels scroll independently at every breakpoint. Their height respects the timeline and the measured planning tray, preserving access to mission context and End Day.
- Sticky panel headers retain a 44-pixel close button, including after scrolling to the final crew member. Panel scrolling does not chain into the underlying page.
- The daily plan shows working/resting crew counts and explicitly explains that assignments reset each day.
- Story actions ignore clicks while a turn is resolving or its report is awaiting review.

Responsive Chrome checks passed at 1280×800, 820×1180, 900×600, 360×640, and 390×844. Each size covered all four panels, scrolled close-button hit targets, End Day visibility and hit targets, panel dismissal, and horizontal overflow. Screenshots were visually inspected on desktop and phone layouts. All 15 simulation tests, TypeScript checking, the production build, and whitespace checks passed. Vite's existing large-chunk warning remains. Physical-phone performance, audio listening, and intended-age usability testing remain pending.
