# Current campaign validation

Verified against the workspace on **15 November 2026**. This document covers the current outbound flight, timed outpost, rover, return flight, and telemetry. Earlier validation records remain linked below.

## Automated checks

| Command | Result | Coverage |
| --- | --- | --- |
| `npm test` | 45 passed, 0 failed | Outbound branching and saves, timed construction and storms, crew and shelter, rover handling and radar, departure and score, and telemetry parsing. Includes regression checks for older game rules. |
| `npm run build` | Passed | Strict TypeScript check and production build. Vite flagged the approximately 640 kB minified JavaScript bundle for size. |

- [Outbound flight rules](../tests/flightMission.test.mjs) cover launch checks, emergency choices, checkpoints, and landing reserves. [Flight persistence](../tests/flightPersistence.test.mjs) covers journal validation, handoff recovery, and independent legacy journals.
- [Timed outpost tests](../tests/outpostSimulation.test.mjs) cover construction, storm boundaries, a 15-day successful run through splashdown, save restoration, departure blockers, and the score. They also cover charge use, terrain-based movement substeps, rescue, radar discovery and cooldown, one-time cache recovery, and migration of older rover saves.
- [Telemetry parsing](../tests/telemetry.test.mjs) verifies the Horizons observer CSV parser and its conversions to kilometers and seconds using a response fixture. That test runs without the external network.

## Browser smoke checks recorded during implementation

| Area | Observed |
| --- | --- |
| Surface controls | Playback and speed cycling, construction and resource updates, editable facility settings retained after reload. |
| Crew and departure | Active job status and named crew assignments. The detailed checklist distinguished a driver still aboard, active jobs, and each supply requirement. |
| Rover | The on-screen driving control moved the rover and drained charge. A radar sweep revealed East Rim as a waypoint. Parking with the rover still deployed restored 4× playback. |
| Storms and dialogs | Warning pause, peak particle animation, reduced-motion static effect, centered loss report with score, and in-game restart confirmation with Cancel. |
| Control Tower | A local preview displayed five simulated readings and all ten external readings, with sources and UTC timestamps. Availability can vary by provider and time. |
| Outbound flight | A browser flight from startup through touchdown opened Day 1 via **Enter lunar outpost**. The chapter menu then offered both the landed outpost and the separate existing save. See the [outbound flight validation](EARTH_TO_MOON_VALIDATION.md) for earlier recovery walkthroughs. |

These are feature checks from local browser sessions. Automated tests cover the complete surface-to-splashdown sequence. A single uninterrupted browser playthrough of the current full campaign has yet to be recorded.

## Release checks to run

- Play through outbound flight, both surface storms, cache recovery, departure, and return in a single browser session. Reload once during surface work, once while deployed, and once after a return command.
- Check full keyboard and touch navigation on representative desktop and mobile devices. Include reduced motion, narrow layouts, fullscreen, and the static map when WebGL is unavailable.
- Measure frame pacing and memory use during rover driving and chapter transitions on target hardware.
- Test production hosting, upstream timeouts, stale telemetry labels, and serverless failure. Check that local mission readings continue to work when upstream requests fail.
- Check storage denial and quota errors in the browser. Test build size and hosted function behavior before any release.

Historical records: [prototype storm drill](PROTOTYPE_VALIDATION.md), [seven-day Lunar milestone](LUNAR_SURVIVAL_VALIDATION.md), and [outbound flight milestone](EARTH_TO_MOON_VALIDATION.md).
