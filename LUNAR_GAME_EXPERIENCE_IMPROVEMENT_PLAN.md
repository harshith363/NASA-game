# Lunar game experience improvement plan

Prepared 14 November 2026 following feedback on the seven-day Lunar game with five specialists.

Status — implemented in the seven-day Lunar game. Physical-device validation and facilitated playtesting remain pending.

## 1. Intended experience

The player leads a crew through a short lunar story. A character notices a problem, the map shows where it matters, and the player compares a few understandable responses. The next scene shows the effect of their decision.

Every main decision should answer these questions on the same screen.

- What needs attention now?
- What can I do?
- What will it cost today?
- What changes later?
- Who can help, and what difference will that person make?

Keep the existing angled outpost, warm console styling, facility colors, soundtrack, and Farm slider. Develop the dashboard, navigation, and story around those established elements.

## 2. Feedback and current causes

These findings combine the user's experience with inspection of the current source. Audience testing is still pending.

| User feedback | Current cause | Proposed change |
| --- | --- | --- |
| Checking each building is confusing | Information is distributed across panels, and the player must decide where to look | Show today's priority, affected building, and next suggested action directly on the map |
| Too much text and unclear impact | Resource accounting, advice, and consequences appear as sentences | Show current value, projected value, cost, and future effect in compact cards |
| Control Centre dropdowns feel generic | Location and air are represented by standard selects | Use illustrated choice cards with visible costs and selected states |
| Control Tower feels unnecessary | The panel mostly repeats the global budget and provides controls | Give the tower a mission dashboard and a real-world observation display |
| More informational hover areas are needed | Explanations are embedded in longer text | Add brief contextual help on hover, keyboard focus, and tap |
| Each building should open its own panel | Every building switches content inside the same fixed workbench | Give each building a dedicated, visually connected panel and preserve map access |
| Astronaut skills are unclear | Role prose and large assignment dropdowns require interpretation | Show one signature skill, one applicable job, and a quantified advantage |
| The experience feels like clicking through menus | Story appears mainly at arrival and the storm warning | Introduce a short scene and meaningful decision at each new situation |
| Crew feels optional and disconnected | The mission can succeed with everyone resting, and some information tasks repeat known facts | Make crew contributions visible in the main objectives, previews, and outcomes |
| More maps and timelines are needed | The map shows locations while most forecasts and progress are textual | Turn the map into the navigation surface and add a mission timeline and resource-flow view |

The code currently calls the control building “Control Tower.” This plan treats Control Centre and Control Tower as that same building. Its player-facing name will be **Mission Control Tower**.

## 3. Screen and navigation design

### Main map

Use the outpost as the normal planning screen, with five elements.

1. A small top HUD for Battery, Reserve air, and Food, each showing current and planned values.
2. A mission timeline showing today, the next known alert, expected harvest, scheduled work, and the final readiness check.
3. A short story card with the speaking specialist, the current problem, and one primary action such as **Help Imani plan the harvest**.
4. Building markers showing a useful state such as **Crop growing**, **Shelter needed**, or **Reply ready**.
5. A compact plan tray summarizing changed decisions and the **End Day** action.

Selecting the story action opens the relevant building and highlights the specific control. The player can freely inspect other buildings and return to the current objective. The objective remains available after dismissing dialogue.

Opening a panel, reading help, or consulting a specialist leaves simulated time paused. Actions update the draft. End Day commits the shared plan once.

### Panels attached to buildings

Give each facility its own layout, title, visual treatment, specialist, and controls.

| Building | Main purpose | Panel content |
| --- | --- | --- |
| Farm | Plan food production and water use | Existing grow-light slider, crop stage illustration, estimated harvest window, food contribution, water budget, and Imani's suggested job |
| Mission Control Tower | Understand mission status and choose protection | Safety dashboard, power breakdown, shelter and air choice cards, alert timeline, Leena and Aya actions, and observation display |
| Communications Centre | Coordinate crew work and explore Earth support | Earth–Moon signal route, incoming messages, forecast investigation, Noah's task, and a compact crew availability view |

On desktop, position the selected building's panel beside its projected screen location when space permits. Use a connector, matching outline, and building name to preserve the association when the panel must move to a screen edge. Constrain the panel to the viewport and keep other markers or a compact building navigation rail reachable.

On mobile, use a bottom sheet headed by the selected building's name and icon. Focus the relevant building above it. Use expandable details for secondary content, and keep the decision and impact summary reachable without navigating to a different building.

Start with one expanded building panel at a time. A global plan tray provides comparison across facilities, and switching buildings preserves every draft choice. A compact crew roster can remain available from the HUD, while individual assignments also appear beside the job they affect.

## 4. Clear decisions and visible impact

### Shared decision pattern

Display every choice using the same information hierarchy.

| Layer | Visible information |
| --- | --- |
| Situation | One short sentence describing the current problem |
| Choice | Two or three large selectable cards, or the Farm's existing stepped slider |
| Immediate impact | Power, air, water, and readiness costs with icons and explicit numbers |
| Future effect | Harvest timing, next-day generation, postponed work, or readiness recovery |
| Optional explanation | Why the system behaves this way and a science source where relevant |

Selected cards use a border, checkmark, and text label. Green indicates a satisfactory condition, amber indicates attention or a trade-off, and red indicates a predicted interruption. Pair every color with an icon and words. Facility identity colors remain consistent across the map and panel.

Show the difference caused by a draft change as well as the resulting total. For example, changing Full lights to Low should reveal both the power saved by that change and the revised crop progress. Use a brief highlight on the affected HUD values, with a static equivalent for reduced motion.

Compute comparisons through the same simulation used by previews and commits. Account for battery capacity, early life-support shortages, specialist effects, and water availability. A saved power unit does not always increase the final battery when storage is already full.

### Mission Control Tower dashboard

Organize the mission view into four compact areas.

- **Crew protection** shows planned location, particle condition, and the next protection deadline.
- **Power today** shows generation, essential systems, grow lights, water recovery, and unused generation when the battery fills.
- **Air systems** shows normal supply, CO₂ removal, and backup-air availability with separate status labels.
- **Next action** offers the relevant character's proposal, with its cost and result.

Replace location dropdowns with **Habitat** and **Storm shelter** cards. Replace air dropdowns with **Normal supply** and **Reserve supply** cards. Each card shows the demand for the current day, including peak costs. Place any predicted shortage beside the responsible choice.

Include a small timeline within the power view so an early shortage remains visible even if later sunlight would refill the battery.

### Farm improvements

Retain the Off / Low / Full slider. Beside it, show the crop's current stage, today's progress, expected harvest, and resulting food contribution. Add a small water-use diagram showing drinking, crop use, recovered water, and remaining storage.

Present harvest timing as a forecast with a stated assumption such as **If these settings continue**. Future radiation restrictions, water shortages, crew rest, and specialist assignments must be reflected in the estimate. When an exact date cannot be supported, show a range or the next known milestone.

## 5. Real-world data in the tower

Add an **Observatory** view to the tower with one featured observation and a short explanation of what the player is seeing. Keep the mission dashboard immediately accessible through clearly labeled view buttons.

Initial content can use a bundled, verified historical observation and one contextual Moon fact. A later refresh feature can retrieve newer observations if the integration proves reliable.

| Content | Presentation | Purpose |
| --- | --- | --- |
| Historical space-weather event | Observation date, observing spacecraft, event category, source, and a simple annotated event timeline | Connect the fictional alert to something scientists actually recorded |
| Earth–Moon distance | A scale diagram labeled **Average distance · 384,400 km** | Explain the location and scale of the mission |
| Selected lunar facts | One visual comparison at a time, with a source and a **Learn more** action | Reward curiosity beyond the immediate survival decision |

NASA provides DONKI event records and API documentation. Verify the fields, units, observing location, availability, and access requirements for the selected record during implementation. A catalog entry can support an event marker. A plotted measurement curve requires actual measurement samples and their units. [NASA CCMC APIs](https://ccmc.gsfc.nasa.gov/tools/API/) · [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/)

NASA gives the Moon's average distance from Earth as 384,400 km. Label that value as an average and attach the source to its information card. [NASA Moon facts](https://science.nasa.gov/moon/facts/)

Label displays **Mission simulation**, **Historical observation**, **Latest retrieved observation**, or **Reference fact** as appropriate. Show the observation date and retrieval time for refreshed data. External observations provide learning context. Any connection to a simulated environmental driver needs an explicit, documented transformation.

For unavailable or stale online data, retain the last valid record with its date and an understandable status. The mission remains playable using its bundled scenario. API keys, if needed, belong in an appropriate server-side integration. Select the final live-data approach after verifying browser access and hosting support.

## 6. Helpful hover, focus, and tap information

Add contextual information to resource icons, meters, crop stages, task effects, skill badges, timeline markers, and observation charts.

Use a short tooltip for a definition or one consequence. Use a dismissible popover when a diagram, example, or source link is helpful. The same content must open with keyboard focus or an information button and with a tap on touchscreens. Escape closes it and returns focus appropriately.

Examples of useful questions to answer include **Why does shelter use power?**, **What does readiness change?**, and **Why did my battery stay full even after lowering the lights?**

Keep costs, deadlines, selected choices, and interruption warnings visible beside controls. Optional help adds explanation. Avoid requiring hover to discover an essential action or consequence.

## 7. Make specialists part of the mission

Present a job where its effect matters, then offer an astronaut to do it. A task card should show the required work, recommended specialist, alternative crew member, readiness cost, completion time, and resulting system change.

| Specialist | Visible skill statement | Story and gameplay role |
| --- | --- | --- |
| Aya, power engineer | **Repair in 1 day · backup needs 2** | Notices an inefficient controller, inspects it, and proposes a repair that changes a later power forecast |
| Mateo, life-support engineer | **Tune recovery · save 1 power today** | Responds to a water or power constraint and previews the exact reserve change |
| Imani, botanist | **Crop care · +2 growth with light and water** | Introduces the first food objective and explains a delayed or accelerated harvest |
| Leena, safety officer | **Shelter checks · teammates spend 1 less readiness** | Leads storm preparation and shows which assigned teammates actually benefit |
| Noah, communications specialist | **Investigate the next forecast window** | Returns an actionable planning update with a clear future consequence |

Noah's current forecast repeats much of the known schedule. Rework the information model so his investigation can narrow an explicitly uncertain future generation forecast or reveal a secondary preparation opportunity. The seed and outcome must be reproducible, and forecasts must remain consistent after reload. Essential danger deadlines stay visible from the warning itself. This is a proposed simulation change and needs balance testing.

Introduce the crew gradually through the first few story beats. Offer **Assign Imani**, **Choose another astronaut**, and **Leave for later** at the Farm, with each choice's effect visible. Display readiness as a short segmented meter with **Ready**, **Tired**, or **Needs rest** plus its numeric value.

Keep a roster for checking everyone's availability. Surface a reason when a person cannot take a job, including a conflicting assignment, insufficient readiness, or unsafe outside work.

Validate that each role creates a distinct, observable decision. Adjust objectives and task opportunities so a successful full mission demonstrates crew contributions. Use opportunities with alternative approaches, such as different crop schedules or a specialist repair versus two backup shifts. The player should understand why an assignment helps.

On resolution, show the assigned character at the affected facility and connect the outcome to their work. A result might read **Aya repaired the controller · tomorrow gains 1 solar power**. Keep both the character and the system consequence visible in the report.

## 8. Guide play through a story

Build an authored sequence around the existing seven days, with branches driven by state. Each beat introduces a situation, invites a decision, and pays it off visually. A new beat should add information or change the decision.

| Beat | Story moment | Player decision | Visible payoff |
| --- | --- | --- | --- |
| Arrival | Imani points out the growing crop and available meals | Choose lighting and optionally assign crop care | Farm lights respond in preview, and the harvest forecast changes |
| Preparation | Aya identifies a controller issue while Leena receives a particle warning | Compare repair time, crop work, and shelter preparation | Scheduled work and the warning appear on the timeline |
| Rising alert | Leena calls the crew inside | Pick protection and revise outside assignments | Crew move to shelter and job markers show postponed work |
| Peak | Mateo reports the increased life-support demand | Choose how to preserve air, battery, and food plans | The budget view and crew response show the selected trade-off |
| Recovery | Conditions improve and the crew returns to work | Resume the most valuable delayed job | A repair or crop milestone changes the next forecast |
| Harvest and finish | Imani reports the harvest outcome | Review remaining reserves and final readiness | Food delivery, crew reactions, and a short decision recap |

Use one primary suggestion at a time, with a short character line and a direct action. Offer optional replies such as **Why now?** and **Show the effect**. The player can explore, dismiss the suggestion, and return to it. Avoid making a sequence of dialogue acknowledgements the main activity.

Once the player has learned a control, reduce prompting. Repeated play can use a compact briefing. Hints should respond to unresolved risk, changed state, or a request for help, with cooldowns and a clear mute option for optional guidance.

The storm GIF remains the opening visual for its first full explanation. Present short situation, cause, risk, and option cards alongside it, followed by optional detail and source information. Preserve the pause control, poster, muted play, and reduced-motion behavior.

## 9. Maps, timelines, and results

### Mission timeline

Show seven days with markers for known alert windows, assigned work, crop milestones, and the finish. Selecting today opens the active briefing. Selecting a completed day opens its report. Future markers show the forecast and its confidence or assumptions.

Use distinct symbols and text for **Committed result**, **Current plan**, and **Forecast**. Update the timeline when a draft changes. Delaying a job or harvest should visibly move its marker.

### Resource flow

Offer a compact power diagram linking solar generation and battery storage to life support, shelter ventilation, crop lights, and recovery. Highlight only the paths changed by the current choice. Selecting a path opens its explanation.

### Map activity

Show crew portraits or suit-color markers at their selected workplace. Draft assignments appear as planned markers. After commitment, characters move and perform the action. Preserve a readable two-dimensional map with the same interactive markers and statuses for WebGL fallback.

### Daily result

Lead with up to three meaningful outcomes, each pairing a cause with an effect. Follow with the next situation and its relevant action. Keep detailed accounting in an expandable area and retain earlier reports in the timeline.

## 10. Implementation sequence

This proposal inserts an experience-improvement milestone before the planned 14-day Lunar expansion. Work through the following increments and validate each playable result.

| Increment | Deliverable | Acceptance |
| --- | --- | --- |
| A — Decision clarity | Control Tower dashboard, choice cards, visual before/after values, and improved Farm impact display | A player can identify the cost and consequence of a choice without opening another building |
| B — Building navigation | Dedicated facility panels, reliable building selection, persistent draft tray, and mobile bottom sheets | Players can reach every building, recognize the selected facility, and retain draft choices while navigating |
| C — Story and crew | State-driven story beats, contextual job cards, skill comparisons, useful forecast investigation, and visible character outcomes | Players can explain why they selected a specialist and observe that contribution in the result |
| D — Timeline and learning | Seven-day timeline, prior reports, resource-flow view, tower observations, and accessible information popovers | Players can connect a past decision to a later outcome and distinguish observation data from mission forecasts |
| E — Usability and balance | Complete journeys, accessibility checks, source review, performance measurements, and first-time playtests | The guided loop is understandable across supported input and display modes; outstanding evidence is recorded |

Build one representative day and one storm decision through the new experience before adapting every day. Use those working examples to check text density, map visibility, the impact cards, and task usefulness.

## 11. Code responsibilities and save compatibility

| Area | Implementation direction |
| --- | --- |
| `src/ui/missionControls.ts` | Keep ownership of draft and commit flow while moving building presentation into focused modules as needed |
| `src/ui/buildingControls.ts` | Coordinate building selection, visible markers, focus return, and keyboard access |
| `src/ui/crewControls.ts` | Supply contextual task selection and a compact roster with skill comparisons |
| `src/ui/stormBriefing.ts` | Reuse its illustration and accessibility behavior within the guided story |
| `src/mission/dailyMission.ts` and `crewOperations.ts` | Remain the source of actual costs, effects, task validity, and outcomes |
| `src/mission/persistence.ts` | Version any new journal fields and preserve replay of historical turns |
| `src/data/` | Own authored story beats, science records, observation metadata, and help content |
| `src/scenes/OutpostScene.ts` | Expose selected-building anchors and display planned and committed activity |
| `index.html` and `src/styles.css` | Implement dashboards, facility-specific panels, timelines, responsive layouts, and focus/selected states |

Save completed story milestones, meaningful information discoveries, and committed results needed by the timeline. Preserve future event selection and uncertainty across reloads. Reopening a tooltip or a building must not create another mission event.

The current save journal reconstructs a run by replaying daily plans. If crew, forecasts, or balance rules change, store a rules version or provide a migration that preserves completed turns and resources. Include actual Phase 1 and Phase 2 saves in regression checks before release.

## 12. Validation and completion criteria

Run existing rule tests and the production build after relevant changes. Add focused regression coverage for any new forecast behavior, rule versioning, and migration. Browser checks should cover navigation, draft retention, preview accuracy, duplicate commits, reload, retry, declined advice, missing media, stale observations, keyboard operation, touch interaction, reduced motion, muted play, and the static map.

Use facilitated sessions with five first-time players from the intended age range when available. Proposed small-sample targets are design checks to tune after observation.

- Four of five identify what needs attention and reach the relevant control without being told which building to open.
- Four of five explain one immediate cost and one future effect before committing.
- Four of five identify a useful astronaut and describe that person's contribution after resolution.
- Four of five find a previous outcome or upcoming deadline on the timeline.
- Four of five understand whether the tower's featured data is historical, recently retrieved, or simulated.
- Record the time to the first meaningful decision, repeated panel visits, help usage, mistaken assignments, and moments where the story stalls.

Complete a full seven-day journey using mouse, keyboard, and a narrow touch layout. Check at least one physical phone before making mobile performance claims. Report any participant, hardware, or external-data checks that remain pending.

## 13. Decisions and handoff

The proposed defaults are a seven-day story, one expanded building panel at a time, archived data for the first observatory release, and progressively introduced crew roles. Live observations and the exact forecast-investigation mechanic need validation during their implementation increment.

The next implementation step is Increment A, followed by Increment B. Their reviewable outcome is a clearer Control Tower, an improved Farm preview, and distinct building panels within the existing map. The story and crew work follows in Increment C, then the complete timeline and learning layer in Increment D.

The older prototype improvement plan records earlier work. The survival expansion plan continues to define Lunar, Station, and Mars scope. This document supplies the next experience-improvement priority based on the user's feedback.


## 14. Implementation handoff

The game opens each planning day with a specialist and one direct action. Dedicated panels connect to map locations on desktop and use a bottom sheet on mobile. Facility choices and job cards share the daily simulation preview. The timeline restores completed reports from the existing save journal, and the Farm estimates harvest timing using current lights, recovery, and safe shelter choices.

The Observatory uses the bundled historical NASA record and a sourced Moon distance fact. Noah's assignment now compares Low and Full lighting against upcoming power and crop needs, with its assumptions in the report. This uses deterministic projections and preserves existing saves. The debrief tracks a crew coordination achievement for a successful run with contributions from all five specialists.

Browser validation used a desktop run with all five specialists and a narrow screen with keyboard and touch emulation, reduced motion, and the static map. Intended-age sessions and tests on physical phones remain pending.
