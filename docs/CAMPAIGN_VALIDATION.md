# Current campaign validation

Verified against the workspace on **15 November 2026**. This document covers the current outbound flight, timed outpost, rover, return flight, and telemetry. Earlier validation records remain linked below.

## Automated checks

| Command | Result | Coverage |
| --- | --- | --- |
| `npm test` | 54 passed, 0 failed | Outbound branching and saves, timed construction and storms, crew and shelter, rover handling and radar, departure and score, and telemetry parsing. Includes regression checks for older game rules. |
| `npm run build` | Passed | Strict TypeScript check and production build. Vite flagged the approximately 671 kB minified JavaScript bundle for size. |

- [Outbound flight rules](../tests/flightMission.test.mjs) cover launch checks, emergency choices, checkpoints, and landing reserves. [Flight persistence](../tests/flightPersistence.test.mjs) covers journal validation, handoff recovery, and independent legacy journals.
- [Timed outpost tests](../tests/outpostSimulation.test.mjs) cover construction, both departure windows, exact boundary ticks, missed-window survival, and legacy return saves. Fixed draws cover every incident at the earliest and latest storm bounds at 1×, 2×, and 4×. Rover checks cover the new routes, radar and cargo limits, sample collection, dock delivery, tow recovery, and older rover saves.
- [Telemetry parsing](../tests/telemetry.test.mjs) verifies the Horizons observer CSV parser and its conversions to kilometers and seconds using a response fixture. That test runs without the external network.

## Browser checks

| Setup | Verified |
| --- | --- |
| Desktop Chrome, static-map fallback | Played from launch to splashdown through both storms, a dust incident, an East Rim collection and tow, and a reload during return. Tested command help by hover and keyboard. The test advanced Chrome's clock to shorten the wait between surface events. |
| Desktop Chrome, second departure window | Resumed the first window's surface state via the direct-outpost entry, passed the Day 16 closing at 4×, verified that boarding was disabled and that a visibility change froze time, then departed on Day 28 and reached splashdown. |
| Desktop Chrome, WebGL | Opened Rover and Departure from their map markers and verified focus returned to each marker on close. |
| Mobile Chrome touch emulation, static-map fallback | Checked the five resources, touch and keyboard navigation, the reduced-motion storm poster, recall and reload acknowledgement, and opening and reopening a geology exhibit after sample collection. A warning interrupted driving and remained readable with both illustration assets blocked. |

A first-time player observation and checks on physical mobile devices remain open. Hosted telemetry, denied storage, and performance on target hardware were outside these local browser checks.

Historical records: [prototype storm drill](PROTOTYPE_VALIDATION.md), [seven-day Lunar milestone](LUNAR_SURVIVAL_VALIDATION.md), and [outbound flight milestone](EARTH_TO_MOON_VALIDATION.md).
