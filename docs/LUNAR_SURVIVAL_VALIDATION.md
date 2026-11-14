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
