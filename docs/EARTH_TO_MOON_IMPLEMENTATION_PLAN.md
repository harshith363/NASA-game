# Earth-to-Moon Flight — Implementation Plan

Status: proposed implementation, 14 November 2026. This document specifies the next playable chapter; flight code has not yet been implemented.

## 1. Product goal and challenge alignment

Turn the current short arrival into a 6–8 minute, guided Earth-to-Moon journey before the seven-day survival mission. Players clear launch with Mission Control, experience liftoff from inside and outside the craft, follow a route map, resolve two resource emergencies, and land beside the existing outpost.

The [challenge statement](https://hackathlone.com/challenges/junior-astronaut-mission-trainer#objectives) asks children ages 7–12 to learn engineering trade-offs through outpost management. Flight is an introduction to those decisions: every repair consumes something, previews explain consequences, and crew advice helps players reason. The lunar survival chapter remains the main mission. Keep three flight resources visible and handle one incident at a time.

Source review: the linked HackAthlone statement was accessible on 14 November 2026. Its linked official Space Apps challenge page returned HTTP 502; recheck that page before submission. Existing archived NASA evidence remains available in the lunar chapter.

## 2. Current implementation and integration constraints

- `src/main.ts` mounts the outpost, mission controls, audio, and intro immediately.
- `src/ui/flightIntro.ts` currently presents sound selection, then an arrival event and a 6.2-second timer. Resume bypasses the introduction. Reduced motion currently bypasses arrival entirely.
- `src/scenes/ApproachScene.ts` contains a standalone spacecraft animation but is not connected to the current main entry point. It is not an Earth-to-Moon simulation.
- `src/scenes/flightModels.ts` supplies the lander and astronauts; extend its visual language with a launch rocket and transit craft. The lander must not launch directly from Earth.
- `src/ui/missionControls.ts` owns lunar save restoration and `enter(resume)`. A fresh entry starts the standard lunar scenario.
- `src/mission/persistence.ts` owns a version-2 lunar journal, including migration from version 1. Preserve both existing resume paths.
- The working tree already contains substantial outpost work. Implement against that current state and avoid reverting or replacing unrelated changes.

## 3. Player journey and storyboard

| Stage | Approximate play time | Experience and meaningful action | Completion gate |
| --- | --- | --- | --- |
| Flight briefing | 30 sec | View Earth on the launchpad, meet the existing crew, select sound or muted play. Explain fuel, battery, oxygen and the goal: reach the Moon with landing reserves. | Start flight, resume, or go directly to outpost |
| Launch control | 45 sec | Tower calls for power, cabin, and navigation checks. Player opens three simple system cards, runs checks, and sends GO. A failed check gives a specific repair prompt. | All checks complete; explicit launch authorization |
| Countdown and ascent | 30 sec | T−10 countdown, ignition, tower flyby, cockpit vibration, clouds giving way to Earth’s curved horizon, stage separation. Captions follow each callout. | Cinematic ends or is skipped |
| Earth orbit and departure | 45 sec | Map explains a parking orbit and departure burn. Player checks projected fuel and authorizes the burn. See the craft leave Earth orbit and coast. | Departure committed |
| Engine challenge | 60–90 sec | A correction-burn cooling fault triggers a calm amber warning. Inspect the affected system, consult crew, compare repair and backup options. Exterior view shows the affected thruster. | Valid recovery committed; result acknowledged |
| Coast and discovery | 30 sec | Cabin-window Earth view and Moon growing ahead. Optional crew conversation and one science fact. Explicit “Continue journey” compresses travel time. | Continue |
| Oxygen challenge | 60–90 sec | A supply-line leak lowers the oxygen reserve. Mateo helps identify and isolate the line; player chooses a powered repair or reserve bypass. | Valid recovery committed; result acknowledged |
| Lunar approach | 45 sec | Authorize braking into lunar orbit, then transfer to the lander through a brief exterior shot. Show descent guidance on the cockpit window and map. | Landing checklist complete |
| Touchdown and handoff | 30 sec | Reuse the existing outpost arrival and crew walkout. Flight report shows choices, remaining reserves, and lessons. | Enter outpost day one exactly once |

This is a fictional, compressed mission architecture. Show “Simulated journey · time compressed” and “Route diagram · not to scale.” Establish Earth launch control separately from the lunar outpost’s Control Tower. Avoid implying the depicted route is an actual Artemis flight plan.

### Launch script

1. Tower: “Flight crew, begin your launch checks.”
2. Aya: “Power ready.” Mateo: “Cabin air ready.” Noah: “Route confirmed.” Each line follows its completed check.
3. Tower: “All systems GO. You may start the countdown.” Player selects **Authorize launch**.
4. “T minus ten … three, two, one … liftoff!” Captions and a visible counter work without audio.
5. Pilot: “We’re climbing. Next stop: Earth orbit.”

Offer **Hold countdown**, **Continue countdown**, and **Skip animation**. Holding or skipping never spends resources twice. After ignition, pause freezes the training sequence; do not label it a real launch hold.

## 4. Visual design and camera direction

Reuse `--console`, `--muted`, `--line`, `--signal`, the Barlow/system typography, thin borders, compact uppercase labels, `.console`, `.action`, `.radio-action`, resource bars, and crew portraits. Keep the muted ceramic/alloy/amber spacecraft materials and low-poly style. Scope new styles under `.flight-*` to protect the outpost layout.

Desktop composition:

- Full-screen Three.js scene with a quiet upper-left phase/objective label.
- Three-resource HUD at the top, matching the existing outpost HUD.
- Compact route map along the lower left; expand it into the main view.
- Crew radio and decision panel at the right. Show one active instruction and two choices at most.
- Persistent view selector: **Cockpit / Outside / Route**; pause, audio, and motion controls remain available throughout flight.

Mobile: scene above a scrollable console, three compact resource meters, full-width decision controls, expandable route map. Keep a visible path to the primary action at 360px width, landscape, and 200% zoom. Use at least 44px touch targets.

Camera sequence: launchpad wide → tower tracking → cockpit ascent → exterior separation → Earth-window POV → transit exterior → Moon-window POV → descent cockpit → existing outpost camera. Use authored camera poses and short eased transitions. Manual view choice persists until the player chooses cinematic camera mode again. No automatic camera switch while reading an incident.

Reduced motion uses static poses, no shake, no star streaks, no flashing warnings, and brief fades. It preserves every gameplay decision. Provide an independent camera-shake toggle for standard motion. The static fallback retains the route, captions, checklist, decisions, and outcomes.

## 5. Route map

Implement an accessible SVG schematic with Earth, departure orbit, transfer arc, Moon orbit, landing site, current craft marker, completed segments, and upcoming checkpoints. Use the same phase data as the scene and HUD. Mark engine and oxygen incidents on the route; selecting completed markers opens their reports without changing state.

Expand view shows current phase, next objective, schematic progress, and simulated mission time. Do not show invented live telemetry, exact trajectory distances, or physically accurate orbital predictions. NASA’s average Earth–Moon distance can appear as a separately sourced reference fact. Label a phase-based progress bar “Journey stages,” not distance traveled.

## 6. Deterministic flight rules

Use an action-driven state machine. Reading, changing views, opening help, pausing, and waiting in a background tab never consume resources. Commit costs only at defined actions. Preview and commit call the same rule evaluator. The renderer never updates mission state.

Proposed first-pass balance, all explicitly labeled **training units**, subject to playtest:

- Start with 18 fuel, 16 battery, 16 oxygen.
- Launch/ascent costs 4 fuel, 1 battery, 1 oxygen.
- Earth departure costs 4 fuel, 1 battery, 1 oxygen.
- Engine recovery incorporates the correction maneuver costs listed below.
- Coast costs 1 battery and 2 oxygen once.
- Oxygen recovery incorporates incident losses listed below.
- Lunar capture costs 3 fuel, 1 battery, 1 oxygen.
- Descent costs 3 fuel, 1 battery, 1 oxygen.
- Oxygen must remain greater than zero; fuel and battery cannot be negative. Before each commit, account for remaining mandatory maneuver and life-support costs. Infeasible choices are disabled with an explanation and a checkpoint retry action.

Flight oxygen describes breathing supply; it is separate from propulsion fuel. Battery powers cabin systems and repair equipment. The model uses combined mission reserves rather than engineering-level per-vehicle tanks; explain that abstraction in the science details.

| Incident | Evidence and choice | Training cost | Lesson and feedback |
| --- | --- | --- | --- |
| Engine cooling fault during a planned correction | Inspect a coolant warning. **Cool and restart** using the backup cooling pump. | 1 fuel, 3 battery, 1 oxygen | The correction succeeds while the longer recovery uses cabin supplies and electrical power. |
| Same engine incident | **Use backup thrusters** to complete the correction. | 3 fuel, 1 battery | The backup works sooner but spends more maneuvering fuel. |
| Oxygen supply-line leak | Isolate the faulty line, then **Power the repair tool** and pressure-test the patch. | 3 battery, 1 oxygen | Repair retains more breathing reserves but costs power. |
| Same oxygen incident | Isolate the faulty line, then **Use reserve bypass** with the faulty branch left isolated. | 1 battery, 3 oxygen | The backup preserves electrical power but leaves less accessible oxygen. |

Both choices must visibly resolve the problem. The oxygen loss in the bypass option includes the simulated incident loss and inaccessible isolated supply; it does not mean bypassing a valve inherently consumes oxygen. Keep carbon-dioxide removal operating on both paths. Do not teach that more oxygen substitutes for removing carbon dioxide.

All four standard combinations reach touchdown: fuel remains 1–3, battery 5–9, oxygen 6–9. Verify these bounds with exhaustive rule tests before tuning. A challenge retry may start with reduced reserves, but must have at least one independently verified viable route.

Show current → projected resources before every decision, including the mandatory landing reserve. Provide **Ask crew** for a short explanation and highlighted trade-off. Confirming creates a durable report; advancing requires acknowledgment. Invalid actions cannot repeat costs or move the phase.

Later replay variants: antenna alignment with a power/time trade-off; electrical bus fault with a battery repair trade-off. Keep the first release to engine and oxygen incidents. Do not add a radiation emergency that duplicates the existing lunar storm lesson or an arcade asteroid field unsupported by the intended lesson.

## 7. Flight state, presentation, and files

Proposed state fields: `runId`, `scenarioId`, `rulesVersion`, `phase`, `resources`, `checklist`, `actionJournal`, `pendingReport`, `outcome`, `handoffStatus`. Keep camera preference, caption display, and cinematic playhead outside canonical mission rules.

Phases: `briefing → checks → launch → earthOrbit → departure → engineIncident → coast → oxygenIncident → lunarOrbit → descent → touchdown → debrief → outpost`. Each phase accepts an explicit finite set of actions. A committed action returns the next state, resource deltas, explanatory report, and presentation events. Use action IDs and phase guards to reject duplicate submissions.

| File | Responsibility |
| --- | --- |
| `src/mission/flightMission.ts` | Pure state transitions, legal actions, previews, mandatory reserves, outcomes |
| `src/data/flightScenario.ts` | Costs, phase descriptors, authored incident schedule and dialog |
| `src/data/flightReferences.ts` | Source URLs, checked facts, simulated labels |
| `src/mission/flightPersistence.ts` | Validated journal replay and flight checkpoint storage |
| `src/mission/flightPresentation.ts` | Typed flight-only visual/audio events |
| `src/scenes/FlightScene.ts` | Earth, Moon, launchpad, rocket, transit craft, camera poses and disposal |
| `src/ui/flightControls.ts` | HUD, checklists, previews, reports, crew advice and pause |
| `src/ui/flightRoute.ts` | SVG route and accessible checkpoint list |
| `src/ui/flightIntro.ts` | Entry menu and resume routing, replacing the timer-only intro |
| `src/audio/missionAudio.ts` | Flight cue support and shared sound preferences |
| `src/main.ts`, `index.html`, `src/styles.css` | Lifecycle orchestration, flight shell and shared design integration |
| `tests/flightMission.test.mjs`, `tests/flightPersistence.test.mjs` | State, budget, resume, migration and handoff validation |

Reuse crew data and portrait assets. Mateo advises on oxygen, Aya on electrical costs, Noah on communications, Leena on checklists, and Imani introduces the supplies awaiting them at the outpost. Use Tower/Pilot dialogue for propulsion guidance rather than silently changing crew specialties.

## 8. Save, skip, retry, and lunar handoff

Use a separate versioned `lunar-training-flight` journal for the first release; keep the current lunar save format intact. Save each committed action and report acknowledgment. Restore resources by replaying validated actions using the recorded rules version; reject unknown actions, invalid phase order, non-finite values, oversized journals, and unsupported versions.

The entry menu offers **Resume flight** when a valid in-progress flight exists and **Resume outpost** when a valid lunar save exists. An existing lunar run remains resumable until a new outpost run is actually initialized. Starting a fresh flight replaces only the flight journal. Explain replacement behavior in menu copy.

- **Skip animation** resolves only the current visual transition; it cannot answer an incident.
- **Go directly to outpost** is an explicit chapter bypass with a neutral flight report. It preserves the existing lunar resume option and creates a new lunar run only when the player selects that action.
- **Retry checkpoint** restores the deterministic pre-incident snapshot and discards only later flight actions. Do not let the retry duplicate rewards or costs.
- Pause suspends audio/animation and leaves all decision state intact. On tab hide, pause presentation; returning never catches up resource drains.
- Corrupt saves explain the recovery and offer fresh flight or the independently valid lunar save. Storage failure permits clearly labeled unsaved play.
- Detect cross-tab journal changes and disable stale commits with a reload instruction, matching lunar behavior.

For handoff, introduce a small versioned campaign receipt `{flightRunId, lunarRunId, status}` outside the lunar journal. Record a prepared receipt, initialize the lunar save with the chosen run ID, then mark completion. On reload, compare the receipt with the saved lunar run ID: resume a matching run, finish an interrupted initialization when safe, and never overwrite a different newer run automatically. Since localStorage writes across keys are not transactional, test interruption at every write boundary.

Pass only a narrative flight summary into the lunar greeting for this release. Lunar resources and crew readiness retain their tested starting values. Flight decisions affect landing reserves and the flight report; they do not silently make the seven-day mission unwinnable. Existing lunar retry remains a lunar-only retry. Offer replay flight separately.

## 9. Rendering, audio, and asset lifecycle

Mount the active flight renderer first; defer the outpost renderer until approach or pause its rendering while flight is active. Keep only one continuous WebGL loop running. At handoff, await outpost readiness, stop flight rendering, then play arrival once. Implement context-loss recovery to the static flight UI.

Use procedural low-poly Earth/Moon forms and spacecraft geometry initially. Any later texture or audio asset must be checked for usage rights, bundled locally, and added to `docs/ASSET_REGISTER.md`. Refactor shared material/geometry ownership before disposal: `flightModels.ts` has module-level shared resources that must not be disposed while the outpost still uses them.

Use pooled exhaust particles, bounded object counts, device-pixel-ratio limits, and no expensive postprocessing by default. Dispose scene-owned materials, textures, geometries, observers, listeners, and animation loops on exit. Target smooth 30fps on a representative mobile device and 60fps on desktop; measure actual hardware and report untested targets honestly.

Add ignition, rumble, staging, burn, soft warning, confirmation, and touchdown cues through the existing audio preferences. Optional recorded radio lines always have captions. Launch sound requires the existing user gesture; muted playback is fully functional. Keep music lower during dialogue. Do not let audio loading or playback failure block progress.

## 10. Science and evidence

Keep verified facts separate from invented flight budgets, incident timing, and route geometry:

- [NASA Moon facts](https://science.nasa.gov/moon/facts/): average distance reference and Moon context. The route display remains schematic.
- [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/): oxygen supply and carbon-dioxide removal are separate life-support functions. This ISS reference informs the lesson, not the fictional spacecraft specification.
- Existing bundled DONKI event: retain its provenance in the outpost chapter; do not claim it caused a fictional engine or oxygen fault.

Before writing detailed launch/burn explanations, verify them against a suitable NASA mission reference and record that reference in `flightReferences.ts`. Do not derive real fuel consumption, oxygen endurance, or spacecraft procedures from the proposed training-unit model. Ship all essential scenario data locally; external sources are optional explanation links, not runtime dependencies.

## 11. Implementation milestones and exit checks

1. **Flight rules and integration contract.** Add typed phases, costs, previews, incidents, report acknowledgment, deterministic replay, and legacy-save fixtures. Exit: every standard route lands, duplicate/out-of-order actions are rejected, existing lunar tests pass.
2. **Playable static vertical slice.** Add the flight shell, SVG map, launch checklist, both incidents, report, and lunar handoff using the shared design. Exit: a keyboard-only muted run completes end to end without WebGL; flight/outpost resume and bypass work.
3. **Launch and POV scenes.** Build launchpad, rocket, separation, orbit, transit and approach; implement cockpit/exterior/map views and reduced-motion equivalents. Exit: each logical phase has an appropriate visual, cinematic skip preserves outcomes, and outpost arrival runs once.
4. **Audio, crew narrative, and persistence hardening.** Add captioned radio, cue mixing, checkpoint retry, failure recovery, cross-tab detection, and interrupted-handoff recovery. Exit: reload during each phase and report reproduces the correct state without duplicate costs.
5. **Balance and release validation.** Complete responsive and accessibility checks, representative-device performance checks, NASA attribution, asset register, build and hosted smoke tests. Exit: a fresh player can explain one repair trade-off and reach the outpost without coaching beyond in-game guidance.

Complete each milestone before expanding its scope. Milestone 2 provides the first fully playable implementation; milestones 3–5 deliver the requested cinematic quality and release readiness.

## 12. Verification and definition of done

Automated rules/persistence checks: four standard decision combinations, mandatory reserve boundaries, invalid actions, repeated clicks, report acknowledgment, corrupt/unsupported saves, legacy lunar v1/v2 restoration, checkpoint retry, unavailable storage, stale tabs, and every handoff write boundary.

Run `npm test` and `npm run build`. Browser checks cover complete flight → outpost day one, existing outpost resume, outpost retry, flight reload at each phase, all view selectors, animation skip, chapter bypass, mute, audio failure, reduced motion changed midflight, pause/tab hide, WebGL failure/context loss, mobile portrait/landscape, keyboard focus, and screen-reader announcements. Announce phase/report changes rather than every animation frame; use text plus icons for warnings.

Record results in `docs/EARTH_TO_MOON_VALIDATION.md` during implementation. Distinguish automated checks, manual browser checks, device measurements, and outstanding child playtesting.

Done means the player can launch with Control Tower guidance, see cockpit and exterior shots, track the route, resolve meaningful engine and oxygen incidents, review the consequences, land, and continue the existing lunar game. The experience retains the app’s design language, works without sound or WebGL, restores saved progress, and makes its scientific simplifications explicit.
