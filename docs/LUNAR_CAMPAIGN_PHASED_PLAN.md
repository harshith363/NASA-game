# Lunar campaign phases

**Status:** The four phases below are playable. The [game overview](GAME_OVERVIEW.md) describes the current player flow, and the [validation record](CAMPAIGN_VALIDATION.md) separates checks already run from release work still open.

The campaign stays on the Moon. Its loop is **assign crew → produce supplies → explore → shelter through storms → prepare the ship → return to Earth**. The original daily-turn designs remain in the [seven-day survival plan](../SURVIVAL_GAME_PHASED_PLAN.md).

## Phase 1 — Staffed facilities and visible crew

- Players build solar arrays, battery banks, and greenhouses on six plots. Construction and offline states are visible.
- Facility panels offer jobs for five specialists. A job shows its prerequisites, reward, assignee, and progress. Default stations and active assignments give crew locations and roles.
- Crew travel, work, and head to shelter. The roster distinguishes returning, sheltered, and rover crew. Warnings and active storms have visual effects and reduced-motion support.
- Older timed saves add default crew state while retaining resources and construction.

**Acceptance:** Assign a specialist, watch them travel and work, earn the reward once, and recall the crew before a storm. The same mission ticks produce the same resource and crew results at different playback speeds.

## Phase 2 — Rover and historical expedition

- Board with an available crew member and drive with keyboard or on-screen steering. The chase camera follows the rover. Driving uses 1×, and parking restores fast-forward.
- Charge from base power, carry finite cargo, and unload at the dock. The driver remains unavailable for other jobs until docking. A recovery tow costs materials and takes mission time.
- The Apollo 12 and Surveyor 3 overlook offers a history exhibit. Collectible supplies are fictional and kept separate from the historic exhibit. [NASA’s Apollo 12 history](https://www.nasa.gov/missions/apollo/apollo-12-the-pinpoint-mission/) · [NASA’s lunar preservation recommendations](https://www.nasa.gov/wp-content/uploads/2017/10/617743main_nasa-usg_lunar_historic_sites_reva-508.pdf)

**Acceptance:** Drive to a cache and the overlook, collect a payload, reload partway through the trip, and dock. The save retains driver, charge, cargo, and discoveries without granting supplies twice.

## Phase 3 — Fifteen-day campaign and Earth return

- The departure gate opens after 15 full days at **Day 16.00**. The checklist separates survival time, storm clearance, docking, shelter release, active jobs, and each minimum reserve.
- Players may keep preparing after the gate. **Board return ship** loads supplies and starts the outbound-style console, trajectory display, and 3D camera for the return.
- Accepted commands advance and save the stages from lunar liftoff through ocean recovery. The debrief scores survival and return, outpost reserves, sustainable operations, and exploration.
- A loss opens a centered report with the reason, score, and retry. Starting a fresh outpost uses an in-game confirmation.

**Acceptance:** Survive both storms, meet the checks, and complete safe splashdown. Verify that saved return progress keeps its current stage and that repeated commands do not spend the same reserves twice.

## Phase 4 — Expanded terrain, radar, and telemetry

- Continuous vehicle movement uses 60 Hz fixed substeps. Slopes and rough terrain affect speed, grip, and battery use. The rover model has independently articulated wheels and suspension.
- The enlarged map has four caches. A Communications job surveys near the base. The rover’s active radar reveals more contacts, which become waypoints.
- The Control Tower’s **Request telemetry** button provides five simulated readings and ten external readings when available. The report labels calculated astronomy, solar and space observations, Earth observations, and mission telemetry. See [telemetry data and availability](TELEMETRY.md).

**Acceptance:** Drive across terrain, sweep for a new contact, collect and unload it, and verify old cargo remains recovered after save migration. Request a telemetry report and check that mission data remains available when upstream data fails.

## Remaining release work

Record an uninterrupted full-campaign browser playthrough, profile target devices, check touch and keyboard paths at narrow widths, and verify the telemetry endpoint on the intended host. Use the [campaign validation checklist](CAMPAIGN_VALIDATION.md) for scope and results.
