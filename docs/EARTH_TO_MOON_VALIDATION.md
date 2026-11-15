# Earth-to-Moon implementation validation

> **Historical reference.** Outbound flight validation snapshot. Historical observations and test totals below apply to the build tested at the time. The surface handoff now opens the timed campaign. See the [current game overview](GAME_OVERVIEW.md) and [campaign validation](CAMPAIGN_VALIDATION.md).

Updated 15 November 2026 (Asia/Kolkata).

## Delivered implementation

The flight chapter is playable from startup through lunar handoff. It includes ground power, avionics, a CO₂ question, navigation fault correction, onboard power, Tower clearance, a holdable countdown, ascent, departure, two recovery decisions, coast, lunar braking, landing checks, touchdown and a flight report. The lunar chapter retains its standard initial resources and existing journal format.

Flight rules and resource previews share a pure evaluator. It explores compatible remaining recovery combinations before allowing an action. Reports require acknowledgment. Flight journals replay actions, including startup and report acknowledgments; presentation timers never drain resources. Checkpoint retry truncates the journal at the most recent incident entry.

The scene supplies procedural launchpad, rocket/staging, transit craft, lander, Earth/Moon and cockpit views. Authored ascent shots, eased camera movement, an optional shake control and reduced-motion poses are implemented. Flight rendering stops before mounting the outpost renderer. Scene-owned geometry and materials are disposed independently of the outpost’s shared model resources. WebGL initialization/context-loss fallback retains the HTML decisions and SVG route.

Separate flight and outpost resume choices, explicit chapter bypass and a lunar-debrief flight replay menu are implemented. Campaign receipts are keyed by flight run ID so a later bypass cannot erase an older handoff’s identity. A flight also preserves the lunar journal observed at its start, preventing a reload from authorizing replacement of a newer lunar run. Prepared receipts recover interrupted writes; completed handoffs resume the matching lunar journal without reinitialization.

## Automated results

`npm test`: **28 passed, 0 failed**. `npm run build`: **passed**, including strict TypeScript checking.

Coverage includes:

- Both valid startup orders, mismatch/load/confirm navigation sequence, power and clearance prerequisites.
- Replay after each committed action and report acknowledgment across all four recovery combinations.
- Duplicate IDs, repeated commits, unknown/out-of-order actions and attempts to skip unread reports.
- Compatible remaining reserves, strictly positive oxygen, and rejection of non-finite reserves.
- Corrupt, oversized and unsupported flight journals; independent lunar v1/v2 restoration.
- Checkpoint rollback and removal of later incident reports/costs.
- Interrupted handoff before each of its three writes, repeated completion, storage failure and preservation of newer lunar runs.
- Later chapter bypass followed by an older flight’s attempted handoff.
- Retention of the original lunar baseline across flight reloads.
- Bundled NASA sample sizes, units/frame metadata, finite coordinates and timestamp order.
- Existing lunar resource and crew-operation regression tests.

| Engine recovery | Oxygen recovery | Fuel at touchdown | Battery | Oxygen |
| --- | --- | ---: | ---: | ---: |
| Cool and restart | Powered repair | 3 | 5 | 8 |
| Cool and restart | Reserve bypass | 3 | 7 | 6 |
| Backup thrusters | Powered repair | 1 | 7 | 9 |
| Backup thrusters | Reserve bypass | 1 | 9 | 7 |

All values above are fictional training units.

## Browser checks performed

Local Chromium-based in-app browser, 14–15 November 2026:

- Muted startup → corrected navigation → clearance → countdown → ascent → cool/restart → repair → touchdown → outpost day one. Observed final flight reserves 3/5/8 and standard lunar initial resources.
- Hold countdown, reload, Resume flight: completed checks and launch authorization retained; countdown restarted at T−10 without spending ascent costs twice.
- Reduced motion enabled during flight; alternate thruster/bypass route completed with 1/9/7. Gameplay remained available with static scene poses.
- Keyboard Enter activation through startup and the alternate recovery/landing path. This is not a full screen-reader or Tab-order certification.
- Wrong CO₂ answer gave corrective feedback without spending reserves. Correct answer committed life support and produced a durable report.
- Checkpoint retry restored the pre-oxygen resources (7 fuel, 12 battery, 12 oxygen on the thruster path). Changing to powered repair then reached the outpost with 1/7/9.
- Two tabs resumed the same flight; acknowledgment in one disabled commits in the other with a reload instruction.
- Route selection and Artemis II comparison expanded successfully. Incident reports were available separately from active decisions.
- Desktop 1280×900 and mobile portrait 360×780 inspected. Both oxygen choices and their resource previews were visible at 360px in route view. Screenshots: `test-results/flight-desktop.jpg` and `test-results/flight-mobile.jpg` (local validation artifacts).
- Outpost resume restored day one. Explicit chapter bypass showed a neutral flight summary and standard lunar supplies.
- No application console errors observed in the original complete run. A later interrupted development server produced a Vite WebSocket error; restarting the server restored navigation. This was a development-server interruption, not a mission-rule error.

## NASA data provenance

`src/data/flight-cabin.json` contains twelve original RR-1 ISS cabin CO₂ readings from 26 September 2014, 00:00–11:00 GMT, in ppm. Source: `https://visualization.osdr.nasa.gov/eda/dashboard_RR-1`, embedded `telemetry_data.co2_iss`. The source dashboard identifies the ISS cabin series and its GMT time column. Every twelfth five-minute row in the first twelve hours was retained; there is no averaging or interpolation.

`src/data/flight-artemis.json` contains 97 sampled XYZ positions from NASA’s `all-artemis-ii-oem-files.zip`, member `Artemis_II_OEM_2026_04_10_Post-ICPS-Sep-to-EI.zip/Artemis_II_OEM_2026_04_10_Post-ICPS-Sep-to-EI.asc`. Metadata: EARTH center, EME2000 frame, UTC, CCSDS OEM position units km; NASA/JSC/FOD/FDO solution created 10 April 2026 03:22:19. The display projects XY with uniform scaling. Points later than creation are explicitly described as predictions from that solution, rather than measured positions. The fictional landing route is shown separately.

Both samples contain exact source URLs, processing notes and SHA-256 digests of the downloaded inputs. `scripts/prepare-flight-data.py` rebuilds them from the downloaded dashboard HTML and archive. Essential samples are bundled into the application; external links are optional.

## Release checks still outstanding

This is a playable implementation with prototype cinematic visuals, not a claim that every release exit check in the plan has passed.

- Representative mobile/desktop hardware FPS, thermal/battery use and memory profiling. No 30/60fps measurements have been made.
- Full screen-reader pass, 200% browser zoom, complete Tab-only traversal, and a completed landscape inspection.
- Forced WebGL initialization failure/context loss, browser storage denial/quota exhaustion and audio-device failure in the browser. Failure handling exists; automated handoff storage failures pass, but these browser-level failure modes are not yet certified.
- Sound-enabled listening/mixing checks on actual speakers/headphones and tab-hide presentation checks on target mobile browsers.
- Hosted production smoke test and official Space Apps submission-link recheck. No deployment was performed.
- Child playtesting: confirm the intended 7–9 minute pacing, comprehension of the repair trade-off and uncoached completion. Current timings do not impose a minimum play duration.
- Further cinematic art direction: richer cockpit instrumentation, stronger exterior staging/descent shots and a dedicated lander-transfer shot. Current models and shots establish the sequence but remain procedural prototypes.

Build note: Vite reports a roughly 602 kB minified JavaScript chunk (about 167 kB gzip). Chunk splitting and target-device profiling remain release optimization work.

## Mission Control redesign

The exterior camera, trajectory and mission operations now share a three-panel desktop layout. Legacy cockpit and view controls were removed. The trajectory uses a schematic Earth departure, transfer and lunar approach with a spacecraft marker, completed track and simulated mission elapsed time, speed, Earth range and flight status. The launch stack is a procedural SLS-inspired model.

A local Chromium browser run verified launch interlocks, the life-support exercise’s corrective feedback, movement of the spacecraft marker during ascent, both incident exercises, keyboard adjustment of the descent trim, landing and the outpost day-one handoff. It also verified signed resource changes in the outpost preview and day report. The three columns fit at 1440px, and the stacked layout fit at 390px without horizontal overflow. Real-device frame rates and playtest engagement still need measurement.

The NASA JSON files now live in `src/data`, where Vite supports their module imports. The development browser run loaded both samples without the prior public asset import warnings.
