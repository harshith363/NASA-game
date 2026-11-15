# Junior Astronaut Mission Trainer enhancement plan

All seven priorities are implemented. The original requirements and acceptance criteria follow. Tests cover both departure windows, legacy saves, all three incident variants, and rover routes and specimen delivery. Chrome checks cover both returns, desktop WebGL, and mobile touch emulation with the static map. A first-time player observation and physical mobile checks remain open. See the [game overview](GAME_OVERVIEW.md) and [campaign validation](CAMPAIGN_VALIDATION.md).

## Implementation notes

- The first window opens on Day 13.00 and closes on Day 16.00. Later windows follow the same pattern every 15 mission days.
- Mission Control displays live locations, assignments, and job cooldowns. The map's **Rover dock** and **Departure** markers open their respective panels.
- New runs save two storm timings and one incident draw. An array repair reserves 12 materials on the first assignment. Canceling resets the work, and the reserved parts stay available for reassignment. Dust cleaning spends 3 power when committed. Earlier saves retain their original storm schedule.
- The seven supply caches count toward the original 150-material score target. The three new geology sites have fictional specimens and locally stored, credited Apollo photographs.

| Priority | Work | Deliverable |
| --- | --- | --- |
| **1** | Recurring departure windows | Make the final three days of every 15-day cycle the only boarding opportunity. Show the deadline and next opening. |
| **2** | Outpost HUD, map controls, and menus | Put resources between mission status and the clock, move Rover and Departure onto the map, and make menus easier to read. |
| **3** | Mission Control crew roster | Show each astronaut’s real assignment, location, work progress, and job availability. |
| **4** | Solar particle storm briefing | Restore the original infographic in the current timed outpost and make the warning actionable. |
| **5** | Launch and descent command help | Explain each command before the player uses it through hover, keyboard, and touch. |
| **6** | Randomized lunar challenges | Vary the timing of two solar storms and draw one additional incident from dust, moonquakes, and micrometeoroid damage. |
| **7** | Rover landmarks, samples, and caches | Add three Apollo-inspired mineral stops with historical photos and sample collection, plus three separate supply caches. |

Build the HUD and map controls before integrating the new crew roster and alerts. Launch and descent help can proceed independently. Establish the storm briefing before randomizing the hazard schedule so all incidents can use the same alert presentation. Tune rover routes and incidents together because both affect the reserves and time available to depart.

## How the implementation agent should use Codex limits

1. At the start of implementation or when resuming, call `mcp__codex_app__get_usage_limits` if available. Use the `codex` bucket in `rateLimitsByLimitId` when present, with `rateLimits` as the fallback. Read `ordinaryUsageAllowed`, the two windows’ `usedPercent` and `resetsAt`, and any available reset credits. Calculate remaining usage as `100 - usedPercent` for each window and use the lower value to size the next batch. The percentages describe shared account usage. Missing values mean usage is unknown. If the tool is unavailable, proceed in small batches and use any limit information surfaced by the host.
2. Start with the highest-priority unfinished work whose dependencies are ready. When usage is tight, complete one small, usable change at a time and verify it before expanding scope. Start Priority 1 by pairing the window rule and boarding guard with the Departure panel’s open or closed status. Follow with boundary alerts and the first- and second-window return checks. For Priority 2, land the compact HUD and map navigation before the broader menu refresh. Continue to the next batch while usage is available.
3. Recheck after a substantial verified batch, before starting a larger change when either window is close to its limit, or when Codex warns about usage. Rapid polling adds little value because other chats can consume the same allowance. Preserve the feature’s acceptance checks and size the batch so there is room to run them.
4. If the host prevents further work, resume from the last verified change when usage is available. Leave a concise handoff with the priority, files changed, checks run and their results, any in-progress work, the exact next step, and the relevant reset time in the user’s time zone if known. Treat reset credits as account information and ask for explicit authorization before redeeming one.

Keep usage checks in the agent’s workflow. The game, tests, and CI use the same implementation regardless of the Codex account running the work.

## 1. Recurring departure windows

**Window rules.** Days are numbered from Day 1 in the HUD. The first window covers Days 13, 14, and 15. The next covers Days 28, 29, and 30. A day takes 60 simulation ticks. At 1× it takes 60 seconds of active play. Pausing, leaving the tab, or saving and leaving the game freezes the countdown. These are training windows set by the scenario.

| HUD time | Tick | Rule |
| --- | ---: | --- |
| Day 12, just before Day 13.00 | 719 | First window closed. Supplies and crew can be prepared. |
| Day 13.00 | 720 | First window opens. |
| Day 15, final tick | 899 | Last opportunity to board in the first cycle. |
| Day 16.00 | 900 | First window closed. Next opening is Day 28.00, 12 mission days away. |
| Day 28.00 | 1620 | Second window opens. |
| Day 31.00 | 1800 | Second window closed. Next opening is Day 43.00. |

### Player flow

1. The Departure panel is available early. Show the next opening day, time until opening, supplies required, rover docking, outdoor conditions, shelter release, and active crew jobs. Keep preparation actions available during the wait. If a safety condition prevents a crew action, show that reason.
2. At opening, pause once and show **Departure window open** with time remaining and a shortcut to the checklist. Let the player board as soon as every requirement is met. Boarding begins the existing playable return and commits ship supplies once.
3. If time runs out, pause once and show **Window missed**. Show the next opening day and the time until then. The player continues managing resources through the closed interval. A missed window does not itself cost supplies or finish the mission.
4. In the departure panel, use a tick-based countdown for the final minutes. The main day label currently rounds to two decimals, so ensure the final eligible tick still reads as part of the open window and the exact closing tick clearly reads closed.

### Implementation and compatibility

- In `src/mission/lunarCampaign.ts`, derive the cycle, open tick, exclusive close tick, and next opening from elapsed time. Use that result in `departureStatus`, `departureChecks`, `releaseDepartureJobs`, and `launchReturn` in `src/mission/outpostSimulation.ts`. Guard boarding in the simulation, even if the UI becomes stale. Check all blockers together before loading any supplies. Preserve the existing return sequence once accepted.
- Replace the single 15-day milestone in `stepOutpost` with opening and closing transitions. Let the timed frame stop at each exact boundary at 1×, 2×, and 4×. Give mission failure priority if it occurs on the same tick. The current second storm clears on Day 12.50. The randomized schedule must also guarantee a clear interval before the Day 13.00 opening.
- Update the panel in `src/ui/campaignControls.ts`, the HUD and instructions in `src/ui/outpostControls.ts`, flight handoff copy in `src/data/flightScenario.ts`, and the current game overview and player guide. Change the score’s surface-survival target to the first window opening so a successful Day 13 departure can earn full survival credit. Keep the 15-point splashdown bonus. Report the cycle and day of departure in the debrief for new returns.
- Existing active saves use their elapsed tick to enter the corresponding window or wait. Display that timing clearly on resume. In-progress and completed returns remain valid even if they originally launched outside the new windows. Prototype a wait with ongoing consumption and production after a missed window. Check that a stocked base can sustain the extra 12 days and prepare for the next opening at 4×.

**Acceptance.** Test ticks 719/720, 899/900, 1619/1620, and 1799/1800. Confirm one announcement per boundary, including after reload. Try boarding from a stale panel after closure, with an undocked rover, and with insufficient supplies. A blocked attempt spends zero supplies. Complete a return from the first and second windows and resume a pre-update return save.

## 2. Make the outpost HUD compact and the menus easier to read

### Top bar and map controls

- Use a single desktop header ordered **Mission status → Resources → Mission clock → Build**. Move the existing live mission status into the left section. Put battery, food, water, oxygen, and materials in a compact strip between status and the clock. Keep the current value visible for every resource. Keep pause and speed with the clock. Put settings and fullscreen in the existing utility menu elsewhere so **Build** is the sole action at the far right.
- At narrow widths, let the header wrap in the same reading order. Keep resources visible near the top, use short visible labels and accessible full names, and preserve usable spacing for clock and Build controls. Avoid a horizontally scrolling HUD or an overlay that covers the map’s key locations.
- Make the existing **Rover dock** a map target that opens rover controls whether the rover is docked or deployed. Make the existing **lander** the **Departure** map target that opens the checklist, including between departure windows. Opening either panel is a read-only navigation action. Keep **Board return ship** as the explicit command within Departure.
- Remove the duplicate Rover and Departure buttons from the top navigation. Give both map locations labeled DOM markers with visible focus, keyboard activation, and usable touch targets. Connect the 3D hit targets and static-map markers to the same actions. Extend `src/scenes/OutpostScene.ts`, `src/ui/buildingControls.ts`, `src/main.ts`, and the outpost/campaign panel handlers. Return focus to the activating marker on close. Keep other facility panels accessible through their map markers, and surface emergency recall within the alert and Mission Control.

### Menu and resource feedback

- Apply a common layout to Build, facilities, Mission Control, Rover, Departure, alerts, exhibits, settings, and the launch and return menus. Give panels more reading room and padding, use larger body text and primary controls, and constrain long lines. On narrow screens, use a wide panel or bottom sheet with scrolling content and reachable close and primary actions. Keep rover steering and the mission clock available where the activity requires them.
- Order each panel by **what is happening → what you can do → what it costs or changes**. Use short sentences, familiar verbs, and descriptive headings. Put secondary science detail in expandable sections. Use the same words for a resource in the HUD, menus, and debrief. Explain terms such as “reserve oxygen” at the control where they matter.
- Display actual changes more prominently with a sign, resource name, and amount such as **−12 materials** or **+4 food**. Add a compact per-day trend where useful and a before-action preview beside choices. Distinguish an instant change from a rate such as **−2 power/day**. Read effects from simulation rules or measured state changes so the UI reflects caps, blocked actions, and changing rates. Pair color with signs or words and avoid reading every tick aloud to assistive technology.
- Example for the Farm: **Greenhouse lights on** → **+3 food/day · −2 power/day · −0.5 water/day per active greenhouse**. After toggling, show the new total rates and which action caused the change. Example for Build: show the material cost before queueing, then show the material deduction and construction time after confirmation.

**Acceptance.** At desktop width, confirm the order of status, resources, clock, and Build. At mobile width, check all five resources and the map controls remain reachable. Open and close Rover and Departure using pointer, touch, keyboard, and the static map. Verify actual and previewed changes for a build, a farm toggle, and a completed job, with visible signs even in grayscale. Ask a young first-time player to locate the dock and explain one resource change.

## 3. Show actual crew activity in Mission Control

- Give the **Mission Control Tower** panel an overview of how many of the five astronauts are available, working, outdoors, sheltered, or deployed as rover driver. Label outdoor and sheltered totals as locations, since they may overlap with activity counts. List all five astronauts by name and role. For each row show their current activity, assigned job or construction plot, destination or current location, remaining work or progress, and the next action if intervention is needed.
- Derive each row from the simulation’s worker position, explicit assignment, construction-team selection, recall state, and rover driver. Distinguish **Available at station**, **Walking to job**, **Working**, **Building**, **Returning to shelter**, **Sheltered**, **Driving rover**, and **Awaiting rover recovery**. Show a blocked assignment as **Paused** with the actual cause, such as insufficient power or a switched-off facility. When a recalled worker has a retained assignment, show their shelter status first and label the job as paused. Use remaining work time when the astronaut is working. Label walking time as an estimate if shown.
- Add a **Jobs** section with the current assignee, job availability, and cooldown. The timed campaign currently stores cooldowns by job in `campaign.cooldowns`. Show the remaining mission time from `cooldownTick - elapsed`, and explain that this delay belongs to the job. Show **Ready**, **Assigned**, **Available in …**, **Completed**, or the actual blocking reason. Keep job-level cooldown separate from personnel availability. Include the specialist’s shorter work time when offering an assignment.
- Reuse `workerStatus`, `activeBuilders`, and `shelteredCount` in `src/mission/lunarCampaign.ts`, and the assignment and input checks in `src/mission/outpostSimulation.ts`. Share job eligibility and progress between facility panels and Mission Control so the same astronaut and job report the same state. Refresh at the existing simulation cadence. Announce meaningful transitions through one status region and keep focus stable as times update.

**Acceptance.** Compare the roster against live state while a crew member walks, works, builds, stops for missing inputs, returns to shelter, drives, and waits for a tow. Confirm cooldown timing across pause, 4×, and reload, including the tick it expires. Verify an available astronaut can still be assigned a different eligible job while a previously completed job cools down.

## 4. Restore the solar storm infographic

Show the briefing when the timed mission enters a warning. At the first warning, open it while the simulation is paused. At later warnings, auto-open a shorter repeat briefing with the original illustration available. Keep a **Storm briefing** action in Mission Control during warning and peak, including after a reload. Use the saved warning acknowledgement to avoid reopening a dismissed briefing on each render or reload. A safety inspection can move the warning earlier, so identify each warning by its storm and use the live schedule to populate the deadline.

The briefing should answer three questions in order:

1. **What happened?** Energetic particles from the Sun can expose astronauts outside shelter. Show the archived STEREO-A observation as the inspiration for the exercise. Label the outpost timeline and solar-output reduction as simulated training values. [NASA DONKI event](https://ccmc.gsfc.nasa.gov/DONKI/events/30717/1/) · [NASA on lunar radiation protection](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/)
2. **What is happening at this outpost?** Show time until peak, crew count in shelter, the rover driver's status if deployed, and the expected drop to 30% of normal solar generation in the current game rules. Explain how shelter and crop lighting affect the battery. Give current power and oxygen readings beside the advice.
3. **What can I do now?** Offer **Recall crew** and **Open rover controls** when relevant. Explain that a deployed driver has to return and dock. Keep a clear close control. Closing the briefing leaves the simulation paused until the player presses Play.

- Reuse `public/media/particle-alert.gif`, `public/media/particle-alert-poster.webp`, and `src/data/archivedSolarEvent.ts`. Adapt the media behavior from `src/ui/stormBriefing.ts` in the timed UI using its own markup and current `OutpostState`. Pass the shared motion preference from `src/main.ts`. Start with the poster in reduced-motion mode, offer an animation pause control, and keep the explanation readable if both image assets fail.
- Use a single blocking dialog at a time. Failure and timed warnings take priority over exploration pop-ups. Clear held drive input, stop the rover using the existing pause path, and restore focus to a valid control on close. Keep the shelter action available from the briefing itself to avoid sending the player through several screens.

**Acceptance.** Trigger both warnings at normal and early-warning times, including one while driving. Verify the existing animation and poster, current crew state, recall behavior, Escape and focus return, reload during the warning, and WebGL-free rendering. Opening, reading, and closing the briefing consumes zero simulation time.

## 5. Teach launch and descent commands before activation

Place a concise explanation beside every command on the **Launch** and **Moon landing** boards. Show it on mouse hover or keyboard focus and add a named info button for touch and for locked commands. Tapping the info button expands the explanation without executing the command. Make the status accessible to screen readers and use a short inline expansion on narrow displays to keep the help within the viewport.

| Command or group | Teaching point |
| --- | --- |
| Start checks and connect ground power | Use pad power while the crew verifies the spacecraft. |
| Power avionics | Start the computers and instruments used for guidance and monitoring. |
| Start life support | Oxygen replenishes breathing gas. The CO₂ scrubber removes the gas the crew exhales. |
| Align navigation, load route, and confirm | Compare the onboard plan with mission control's approved route and confirm the correction. Explain the procedure before the exercise and keep its answer in the exercise flow. |
| Switch to onboard power | Verify the spacecraft can operate from its own supply before leaving the pad. |
| Request GO and authorize launch | Mission control checks readiness. Launch authorization starts the countdown once GO is given. |
| Hold or resume countdown | The hold delays ignition and gives the crew time to review readiness. |
| Authorize lunar braking | Slow relative to the Moon so the spacecraft can enter lunar orbit. |
| Confirm landing site and lander | Confirm the target and vehicle readiness before powered descent. |
| Authorize descent | Use the engine to slow for landing. Show the current training cost in the existing preview. |

- Add pre-action copy keyed by `FlightAction` in `src/data/flightScenario.ts`, with separate wording for system controls such as countdown hold. Render it through the command rows in `src/ui/flightControls.ts`. Reference the existing preview for reserve amounts and use the existing legal-action and preview results for status. Add explicit missing-prerequisite wording where the current row only says **Locked**.
- Keep hover text available while a pointer moves over it and allow dismissal with Escape. Keep the info trigger focusable when the command is disabled. Associate the explanation with the command alongside existing status and cost descriptions. Avoid excessive announcements when the console rerenders. Test readable help near the bottom and sides of the viewport.

**Acceptance.** Walk through the full launch checklist and landing checklist with mouse, keyboard, and touch. A new player should be able to explain ground versus onboard power, the purpose of the scrubber, and the difference between lunar braking and powered descent before committing the corresponding commands. Opening help must leave resource values, the command journal, and flight phase unchanged.

## 6. Randomize lunar challenges

### Scientific framing and choice

| Candidate | How it fits the trainer |
| --- | --- |
| **Micrometeoroid impact** | A simulated hit damages one section of the base array. Players choose to repair it or cover the shortfall with other resources. [NASA Lunar Impact Monitoring](https://www.nasa.gov/meteoroid-environment-office/about-lunar-impact-monitoring/) |
| **Moonquake** | A sensor detects shaking, followed by a simulated safety inspection of the recycler. Players choose between assigning inspection crew and running on stored water while the system is isolated. Explain the types of moonquakes Apollo instruments detected. The drill starts after detection. [NASA Moonquakes](https://science.nasa.gov/moon/moonquakes/) |
| **Lunar dust** | Dust from surface operations reduces array output. Players choose between using an electrodynamic cleaning cycle that spends power and deferring cleanup. The training site stays sunlit, and the briefing presents terminator lofting as a separate research question. [NASA LADEE findings](https://science.nasa.gov/mission/ladee/outcome/) · [NASA dust-shield demonstration](https://www.nasa.gov/image-article/nasas-dust-shield-successfully-repels-lunar-regolith-on-moon/) |

### Save the draw once per run

- Generate a schedule when a new timed outpost is created through either entry path. Draw one of the three additional hazards and a start tick for it. Vary the start and duration of both storms within bounded ranges. Save the resolved schedule with the run before play begins. Tests can supply a fixed seed or schedule. Reading a save, retrying an action, opening a panel, or changing playback speed uses the same stored schedule. An explicit **New outpost** creates a new draw.
- Prototype bounds below are in simulation ticks, with 60 ticks per mission day. They are adjustable after playtesting. Preserve the current 60-tick warning and the 30-tick bonus from the shelter inspection. Centralize schedule access so the storm countdown, forecast, simulation, scene, and rover rules all use the same values.

| Event | Start tick | Duration or constraint |
| --- | --- | --- |
| First solar storm peak | 210–240 | 90–120 ticks. Clears by tick 360. |
| One lunar incident | 415–475 | Single detection between storms. Repairs or resource penalties can continue until resolved. |
| Second solar storm peak | 615–630 | 45–60 ticks. Earliest enhanced warning is tick 525. Clears by tick 690, at least 30 ticks before departure opens. |

- Preserve the existing fixed storm schedule for saves created before this change. Do not introduce a past incident into those saves. Keep the first version’s draw within the first window cycle and let players manage any unresolved damage while waiting for later departure. Store and validate the schedule and incident state with both direct and flight-linked saves.

### Playable responses

- **Impact drill.** Start tuning with a loss of 2 power/day from the original array. Prototype repair at 12 materials and 30 work ticks plus walking time. An expansion array or turning off greenhouse lights can cover the shortfall while the damage remains. Show the resulting battery and food trade-off before the player commits.
- **Moonquake drill.** Temporarily isolate the recycler in the scenario. Display the water deficit and offer an inspection job to bring it back online. The player can defer the inspection and draw down stored water. Tie downtime to the simulated equipment check and allow enough reserve for a reasonable response.
- **Dust drill.** Reduce some solar generation until the player runs an electrodynamic cleaning cycle. Preview the instantaneous power cost and the restored generation rate. Let players defer cleaning while using reserves or spare capacity. Tune the cost so it competes with other power uses without blocking recovery at low charge.
- Pause once on detection and show the observed equipment status, the resource change, and the response options. Use the same alert presentation as the storm briefing. After the mission, report which incident occurred, how the player responded, and the resource impact. Label the draws, values, and effects as simulated training parameters.

- Save detection, acknowledgement, penalties, and repair progress. Apply costs atomically on commit and define refund behavior before implementation. Use `rates()` for ongoing penalties and the shared tick path for job progress. Repairs and inspections follow existing crew recall and facility restrictions. Show their progress in Mission Control and ensure completion or repeated clicks cannot deduct supplies twice.

**Acceptance.** Use fixed test draws to exercise all three incident types and the earliest and latest schedules. Verify matching outcomes at 1×, 2×, and 4×, one alert per event, stable draws after reload, and an unchanged schedule on existing saves. Complete the first departure window on each incident path, then miss it intentionally and verify a viable second-window return. Confirm that a rover driver can close an alert and regain controls safely.

## 7. Expand rover exploration

### Three new landmarks and mineral stops

Add three **fictional training sites inspired by separate Apollo missions**. Keep their distance and placement plausible within the game’s map, and say in each exhibit where the historical event actually took place. The Apollo 12 and Surveyor 3 overlook stays available as the existing fourth history stop. Store a short mission history, one or two NASA archival photos per new stop, captions, accessible alt text, photo credits, and a labeled sample action.

| Training landmark | Exhibit and proposed sample | Photo source |
| --- | --- | --- |
| **Genesis Ridge** | Apollo 15 at Spur Crater. The Genesis Rock was anorthosite, a clue to the Moon’s early crust. Collect a fictional **anorthosite sample**. | NASA’s Hadley–Apennine excursion page and Genesis Rock resource. [Apollo 15 field history and photos](https://www.nasa.gov/history/50-years-ago-apollo-15-on-the-moon-at-hadley-apennine/) · [NASA Genesis Rock resource](https://science.nasa.gov/solar-system/moon/genesis-rock/) |
| **North Ray Highlands** | Apollo 16 explored the lunar highlands and sampled impact-fragmented rocks around North Ray Crater. Collect a fictional **highlands breccia sample** and explain how impacts can fuse fragments. | Match the selected photograph to the event or sample using NASA’s caption. [Apollo 16 mission details](https://www.nasa.gov/missions/apollo/apollo-16-mission-details/) · [NASA North Ray sample catalog](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a16/A16SampleCat_3.pdf) |
| **Orange Glass Crater** | Apollo 17’s crew found orange soil near Shorty Crater. Volcanic glass beads help tell the history of lunar eruptions. Collect fictional **orange glass-bearing soil**. | [NASA Shorty Crater field photo](https://apod.nasa.gov/apod/ap150802.html) · [NASA orange-soil close-up](https://eol.jsc.nasa.gov/SearchPhotos/photo.pl?frame=20989&mission=AS17&roll=137) · [NASA lunar sample notes](https://ares.jsc.nasa.gov/interaction/lmdp/diskdetails.cfm?class=Orange+Soil&disk=80) |

### Approach, collect, and return

1. Show distinct geology markers in the drive view, waypoint picker, and static map. As the rover approaches within roughly 4 world units, display **Slow down to examine**. Once within that radius and below the existing collection speed threshold, open the exhibit automatically on the first approach. Pause, clear held inputs, and focus the dialog. Driving through at speed gives a prompt without forcing an abrupt stop.
2. The exhibit shows the history and photo captions with **Collect sample** and **Continue exploring**. Collection validates the exact landmark, active surface mission, driver, proximity, safe conditions, and that the sample is still available. Keep phases separate for visited, aboard, and delivered. Reloading, clicking twice, and reopening the exhibit must preserve one-time collection. A dismissed exhibit can be reopened on demand while nearby. Prevent a repeated auto-open while the rover remains within the approach zone.
3. Put samples in a separate small specimen rack with one slot per landmark. Docking transfers the rack to the outpost log, including after a tow. The final debrief shows delivered samples and landmarks visited. Keep the original exploration score capped at 20 for this pass, with new caches contributing toward the original 150-material target and sample achievements reported alongside the existing score. This avoids increasing the expedition workload for a full score.
4. Alerts and mission failure take priority. Suppress auto-open during an active warning, storm, or tow. Keep archive captions and credits readable without a network connection. Download and optimize the selected NASA images during implementation, verify credits and usage conditions per asset, and register them in `docs/ASSET_REGISTER.md`. The samples are taken from fictional geology stops, with Apollo hardware and historical artifacts presented for viewing. [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) · [NASA recommendations for lunar heritage sites](https://www.nasa.gov/wp-content/uploads/2017/10/617743main_nasa-usg_lunar_historic_sites_reva-508.pdf)

### Three additional supply caches

Add **West Traverse**, **North Shoulder**, and **Southwest Pass** as working names. Put one on a short beginner route, one on a medium route near a geology detour, and one on a route that rewards checking battery before leaving the dock. Prototype at **15, 20, and 25 materials**. Place them in free terrain within the current map, with enough return charge on a practical route including a scan. Place each outside overlapping collection radii and keep existing cache coordinates and rewards stable.

- Extend `cacheSites` in `src/mission/lunarSurface.ts` for seven total caches. Reuse the current radar, cargo capacity, waypoint navigation, recovery tow, and dock transfer. Add a separate landmark catalog for exhibit content and locations. Validate schema additions in `src/mission/lunarCampaign.ts` and initialize missing landmark/sample records during outpost save migration.
- Drive proximity detection from current rover state, outside DOM rendering. Preserve radar discovery rules for supply caches and require the selected or displayed target when collecting. Update `src/ui/campaignControls.ts`, `src/scenes/OutpostScene.ts`, and the static fallback together so the same landmarks and caches are visible and reachable in both. Show full-cargo and out-of-range reasons without consuming the cache.

**Acceptance.** Discover each new cache, run a full-cargo rejection, and dock with its payload. Stop at each landmark, read its exhibit, collect and deliver the sample, reopen the exhibit, and verify that returning to the area grants nothing twice. Reload with a sample aboard and test tow recovery. Verify the original four caches and saved historical visit still work. Check every route against actual charge, terrain, scan cost, and the time needed to get back before the departure window closes.

## Integration and release verification

1. For each priority, run the relevant existing tests and `npm run build`. Add focused regression checks where current coverage cannot catch new window boundaries, double collection, hazard replay, or save migration.
2. Play one full campaign from launch through landing, both solar storms, one drawn incident, a rover expedition, and return. Depart in the first window. In a separate run, deliberately miss it, sustain the base, and depart in the second window. Check paused time, tab changes, save/reload, and both outpost entry routes. Cover the other hazard variants with fixed test draws.
3. Run the flight help, outpost menus, map markers, storm briefing, and geology exhibits with keyboard, touch, and reduced motion. Include a narrow viewport, blocked media, and the static-map fallback. Check the roster, warning, and departure alerts when the rover is running at 1× and the base is running at 4×.
4. Ask a new player to explain one launch command, one shelter or power trade-off, and when the next departure window opens. Record where they need a prompt. Review the in-game historical captions and make sure a player can distinguish the archived observation, original Apollo sites, and fictional training events.
