# Junior Astronaut Mission Trainer — survival expansion

Prepared 14 November 2026. Implementation handoff for a new chat.

## 1. Outcome and agreed sequence

- Audience — children ages 7–12, with accessible browser play.
- Experience — lead five astronauts through a simulated mission, manage interconnected resources, respond to weekly events, and explain the consequences of decisions.
- Build order — shared foundation → complete Lunar experience → Space Station → Mars → additional missions and features.
- Visual direction — retain the current angled 3D outpost, dark mission consoles, warm lighting, facility colors, Barlow typography, telemetry, arrival sequence, and adaptive soundtrack.
- Interaction direction — prominent buttons, dropdowns, sliders, crew cards, readable forecasts, and immediate previews.
- Content direction — short dialogue turns, labeled facts, bullet lists, comparisons, and action cards throughout the game.
- Challenge direction — problem GIF first, followed by a complete structured explanation, specialist dialogue, decision controls, and visible consequences.
- Delivery — working increments with a playable finish at each mode milestone.

## 2. Starting point in the repository

| Area | Current implementation | Expansion approach |
| --- | --- | --- |
| App | TypeScript, Vite, Three.js, HTML/CSS | Extend the existing stack |
| Simulation | `src/mission/solarStorm.ts` implements a two-shift drill | Reuse preview/commit behavior for daily simulation |
| Facilities | Farm, Control Tower, Communications Centre | Give each facility clearer daily functions |
| World | `src/scenes/OutpostScene.ts`, procedural facilities and terrain | Add state-driven models and mode-specific scenes |
| Crew | Three visible astronaut models | Expand to five identifiable specialists |
| UI | `src/ui/missionControls.ts`, `buildingControls.ts`, `missionRadio.ts` | Refactor into daily controls, crew dialogue, and challenge presentation as needed |
| Audio | `src/audio/missionAudio.ts` | Reuse musical themes and event-driven cues |
| Science | Bundled archived DONKI event | Extend with verified source records for each mechanic |
| Validation | Rule tests and documented prototype checks | Add checks for new simulation risks and complete mission journeys |

- Read `README.md`, `docs/PROTOTYPE_VALIDATION.md`, and the relevant source before editing.
- The workspace has substantial existing modified, deleted, and untracked files. Treat the working tree as the current prototype and preserve the user's work when integrating changes.
- Prior plans describe the completed prototype. This document defines the next expansion.
- Re-run the existing checks to establish the baseline. Previously documented results describe an earlier verification session.

## 3. Proposed gameplay defaults

These defaults make the plan implementable. Tune them through playtesting.

| Decision | Starting proposal |
| --- | --- |
| Clock | Player-controlled daily turns, with an explicit End Day action |
| Mission length | 14 simulated days for Lunar and Station, 14 sols for Mars |
| First playable milestone | Seven-day Lunar training run |
| Week | Seven simulation turns, displayed as a mission scheduling convention |
| Event frequency | One major event selected within each seven-turn block |
| Tutorial | Fixed first event, followed by varied weekly events |
| Crew | Same five characters across modes |
| Mode entry | Fresh supplies and mode-specific objectives |
| Progress | Completed missions and learning discoveries carry between modes |
| Success | Keep the crew safe through the final turn and meet the mission's stated readiness objective |
| Failure | Training interrupted, with the causal chain and a retry option |
| Persistence | Save after committed turns and restore the same event schedule |
| Intended session | Approximately 10–15 minutes initially, adjusted after first-time playtests |

### Daily loop

1. **Briefing** — day/sol, environmental forecast, resource trends, active event.
2. **Consult crew** — relevant specialist explains the situation and available options.
3. **Plan** — adjust systems, select tasks, choose protection and research activity.
4. **Preview** — see tomorrow's reserves, delayed effects, and explicit warnings.
5. **End Day** — commit the plan once.
6. **Resolve** — animate crew and equipment, apply the simulation, and show a short report.
7. **Continue** — save the result and open the next briefing or mission debrief.

- Planning pauses simulation time.
- During event resolution, short internal steps can represent warning, peak, and recovery.
- Lunar planning days use 24-hour mission scheduling. Solar illumination follows the chosen site's scenario.
- Station daily turns summarize repeated orbital light/shadow cycles.
- Mars uses the label **Sol**, explained once as a Martian day.
- Communication timers use simulated time and show when a response will arrive within a day. Earth/Mars signal travel alone should not become a full-day wait.

## 4. Variables and interconnections

### Shared simulation

| Variable | Daily change | Connected decision |
| --- | --- | --- |
| Battery energy | Generation minus system use, bounded by capacity | Allocate power to air, water recovery, crop lights, shelter ventilation, and communications |
| Reserve air | Backup consumption and replenishment when supported by installed equipment | Use efficient normal life support or spend finite backup reserves during a fault |
| Water | Drinking and crop use minus recovered water and scheduled supply | Spend power on recovery or consume stored reserves |
| Food stores | Crew consumption plus scheduled deliveries and mature harvest contributions | Maintain provisions while investing in later crop output |
| Crop progress and condition | Respond to light, water, and interruptions over several turns | Reduce lights today and accept a later or smaller harvest |
| Equipment condition | Announced wear or event damage, restored through repair | Spend crew time and spare parts to restore output |
| Crew readiness | Work and rest affect available task capacity | Assign specialists to repairs, operations, research, or recovery |
| Radiation protection | Event conditions plus crew location and shielding | Suspend exposed activities and occupy a protected area |
| Mission progress | Completed research and readiness tasks | Balance useful work against resource reserves |

- Start the HUD with **Battery**, **Reserve air**, and **Food**. Put **Next harvest** in the Farm panel.
- Introduce water and crew readiness through their relevant tutorial days. Show an alert on the HUD whenever a hidden detail becomes urgent.
- Show generation and consumption separately in the power panel so a full battery cannot conceal an unsustainable daily budget.
- Present air-system operation, CO₂ removal, and reserve-air status with distinct labels. Reserve-air quantity alone does not establish breathable conditions.
- Treat crops as a supplemental food contribution, with an explicit growth period and stored provisions available from arrival.
- Limit each astronaut to one main daily assignment initially. Routine system operation is included in the base workload.
- Use clearly identified game units until a quantity is supported by a documented physical model.

### Main causal chains

- Reduced sunlight → lower power generation → battery draw → fewer resources available for farming or research.
- Life-support fault → higher power demand or reserve-air use → repair takes specialist time and spare parts.
- Reduced water recovery → falling water reserves → less water available for crops → delayed food contribution.
- Crop lighting and water over several days → crop maturity → harvest → increased food stores.
- Radiation warning → crew sheltering → postponed outdoor tasks → repair or research delay.
- Heavy workload → lower readiness → less task capacity → slower recovery unless rest is scheduled.

For each chain, display the immediate effect and one understandable future effect. Introduce the full set gradually across the Lunar tutorial.

### Differences between modes

| Mode | Environmental drivers | Distinctive trade-off | Example event pool |
| --- | --- | --- | --- |
| Lunar | Site illumination, surface dust from activity, particle-event warnings | Battery reserves and protected crew time compete with crop growth and outdoor maintenance | Solar particle alert, panel obstruction, air-system fault, irrigation fault, forecast-link outage |
| Space Station | Repeated eclipses, enclosed systems, scheduled cargo, microgravity workload | Power storage, repair time, and experiments compete within a tightly recycled habitat | Battery-bank fault, CO₂ scrubber fault, water-recovery fault, cargo delay, cooling-loop fault |
| Mars | Dust opacity, seasonal/site conditions, distant Earth support, finite supplies | Several days of preparation and local diagnosis determine recovery options | Dust episode, power-conversion fault, water-pump fault, greenhouse setback, communications interruption |

- Use verified environmental observations to shape scenarios.
- Record the scientific source, location, time period, and gameplay transformation for each driver.
- For shielding, distinguish passive protective material from power needed for ventilation or other occupied-shelter systems.
- A lunar particle alert is communicated through instruments and crew response.
- A Mars dust episode primarily demonstrates reduced sunlight and its consequences for a solar-powered base.

## 5. Five astronaut specialists

Names and portrait designs can be chosen during the crew phase. Roles below define the required behavior.

| Astronaut role | Primary / secondary skill | Typical dialogue or event | Mechanical contribution |
| --- | --- | --- | --- |
| Power engineer | Power / mechanical repair | Battery depletion, panel fault | Efficient electrical repairs and clear energy forecasts |
| Life-support engineer | Air / water recovery | Scrubber or recycling failure | Diagnose and restore air and water systems |
| Botanist | Crop production / nutrition | Water shortage, delayed harvest | Explain growth needs and improve crop recovery |
| Crew safety officer | Radiation protection / crew wellbeing | Particle alert, overwork | Advise on shelter timing and rest assignments |
| Communications specialist | Communications / mission coordination | Forecast outage, delayed Earth advice | Restore links and organize information for decisions |

- Give each astronaut a portrait, name, role badge, recognizable suit accent, and distinct speaking style.
- Display competence through understandable task costs or completion times. Show each modifier before assignment.
- Give backup crew a slower recovery option when the ideal specialist is unavailable.
- Let two specialists discuss cross-system problems in short alternating turns.
- Keep the player's authority visible through selectable replies and action buttons.
- Use authored dialogue with validated state substitutions for reserves, forecasts, and outcomes.

## 6. Controls and structured game text

| Element | Planned treatment |
| --- | --- |
| Primary action | Large, high-contrast End Day button, with projected reserve summary beside it |
| Option buttons | Raised mission-console styling, icons plus labels, selected border, pressed feedback |
| Dropdowns | Large labeled fields for crew, task, and scenario selection, with current value and an obvious arrow |
| Sliders | Wide tracks, large thumb, snap points, live cost/output labels, keyboard increments |
| Resource meters | Current value, projected change, and estimated reserve duration where calculable |
| Crew cards | Portrait, skill, current task, readiness, assignment action |
| Forecast | Compact timeline of known environmental changes and event deadlines |
| Result cards | Resource change, cause, future consequence, next available action |

- Use a stepped grow-light slider with **Off / Low / Full** positions initially.
- Keep power choices affordable through an aggregate budget preview and explain conflicts near the affected control.
- Give every control a visible label, keyboard focus, disabled reason, and sufficient contrast.
- Target touch areas of at least 44 × 44 CSS pixels as a project design choice.
- Use color together with text and symbols for warnings and selected states.
- Make audio and motion preferences available during play.
- Use a mobile bottom panel that leaves the most relevant world objects visible and every control reachable.

### Content format

- **Situation** — one sentence.
- **Cause** — one or two bullets.
- **At risk** — affected systems and deadline.
- **Options** — action cards with costs and consequences.
- **Crew advice** — short dialogue turns.
- **Science** — brief factual explanation and source link.
- **Result** — what changed and why.

Use one idea per text block. Keep the full explanation available through structured sections and expandable details. Primary information should appear before the decision controls.

## 7. Challenge presentation and event design

### Presentation sequence

1. Show a brief alert and focus the relevant facility.
2. Display a 3–6 second looping **problem GIF**, with a caption and pause control.
3. Present the full situation using the structured fields below the visual.
4. Introduce the lead astronaut through an expressive portrait, radio cue, and short dialogue.
5. Offer replies such as **Explain the risk**, **Show the trade-off**, and **Open controls**.
6. Preview the player's selected response in the normal resource controls.
7. Commit the response with the day's plan and animate the resulting action.
8. Show a concise report and retain the dialogue and science explanation in the mission log.

- Provide a still poster for reduced motion or media failure.
- Start with one short GIF per challenge family. If a looping video materially improves performance, make that format substitution an explicit implementation decision and retain the requested visual behavior.
- GIFs illustrate the mechanism through instrument readings, equipment movement, or a clearly labeled cutaway.
- Source panels identify reconstructed illustrations and archived observations.
- Text appears immediately, with an optional reveal effect that can be skipped.

### Example Lunar event — particle alert

| Panel item | Example content |
| --- | --- |
| Visual | Instrument trace rising, crew moving toward the shielded shelter |
| Situation | A solar particle alert is active. Protect the crew before the peak. |
| Cause | Energetic particles can increase exposure during outdoor work. |
| At risk | Crew safety, outdoor repair schedule, available battery |
| Safety officer | “The alert is rising. I can move everyone into the shelter. Which outdoor work should we postpone?” |
| Power engineer | “Shelter ventilation needs power too. Lowering the grow lights will leave more battery for the peak.” |
| Player replies | Show the forecast / Compare power plans / Open shelter controls |
| Options | Shelter and dim lights / Shelter and use backup air where sufficient / Shelter and postpone research |
| Preview | Battery after peak, backup-air remaining, harvest delay, postponed task |
| Debrief | Crew protection achieved, resource costs, delayed harvest or task, source-backed science fact |

### Event record

- Identifier, mode, eligible week, prerequisite systems.
- Lead and supporting astronaut.
- Warning, start, deadline, duration, and recovery conditions.
- Trigger and selection weight.
- Affected variables and explicit simulation effects.
- Available responses, costs, and delayed consequences.
- GIF/poster paths, captions, dialogue branches, and source references.
- Success, partial recovery, and interruption explanations.

### Randomness and fairness

- Seed the run and save event selection so reloads reproduce the same mission.
- Select one eligible major event per seven-turn block, with a variable arrival day.
- Schedule the first tutorial event early enough to teach the loop.
- Draw later events from systems the player has already encountered.
- Prevent accidental overlap of unresolved major events in the initial release.
- Give every generated starting situation at least one feasible response. Later shortages can follow the player's earlier choices.
- Use forecasts and warnings to communicate preparation opportunities.
- Label weekly event frequency as training-scenario pacing.
- Resolve events that cross a week boundary consistently, and keep final-day event outcomes achievable within the run.

## 8. Phased implementation

### Phase 0 — baseline and shared setup

**Deliverables**

- Inspect the current working tree and run `npm test` and `npm run build`.
- Record the existing desktop and mobile appearance for comparison.
- Define shared mission state, daily plan, event state, crew task, and mode configuration.
- Define a deterministic daily transition with matching draft previews and committed outcomes.
- Define versioned save data, a recovery path for invalid saves, and explicit new-run behavior.
- Establish the common HUD, panel spacing, control states, and content patterns.
- Record initial asset sizes and rendering performance on available devices.

**Acceptance**

- Baseline results are recorded.
- Current visual identity is documented with screenshots or an equivalent verified reference.
- Every proposed simulation variable has a clear purpose, owner, and daily update rule.
- Proposed source files map to real responsibilities in the existing application.

### Phase 1 — basic Lunar daily survival

**Deliverables**

- Convert the existing lunar experience into a seven-day training run.
- Add daily generation, consumption, food stores, delayed crop progress, and resource forecasts.
- Introduce water through the Farm/life-support panels once the first resource choices are understood.
- Implement End Day, daily resolution, report, mission finish, retry, and save/resume.
- Rebalance the existing storm for the new economy and five-person consumption assumptions.
- Add the improved buttons, dropdowns, stepped slider, and structured facility text.
- Reuse the existing buildings, arrival, and soundtrack.

**Acceptance**

- A player can complete the run from arrival to debrief.
- At least two understandable strategies meet the core objective.
- Crops have delayed output and food consumption is visible.
- Draft previews match resolved results.
- Reload and retry preserve or reset the intended state without duplicate effects.

### Phase 2 — Lunar crew, visuals, and dialogue

**Deliverables**

- Introduce all five astronaut characters and five matching world models.
- Add crew cards, daily assignment dropdowns, readiness, and limited task capacity.
- Add specialist explanations and state-aware dialogue branches.
- Add one complete animated storm briefing, including the problem GIF and still fallback.
- Add visible task animations for sheltering, inspecting equipment, adjusting lights, and repairing a facility.
- Convert all new gameplay copy into the structured content pattern.

**Acceptance**

- Each specialist's skill changes at least one relevant task or decision.
- A player can identify who to consult from the crew UI.
- Dialogue values match the current mission state.
- The challenge explanation is complete in muted and reduced-motion play.
- The GIF, explanation, controls, and result form one coherent flow.

### Phase 3 — complete Lunar events and replay

**Deliverables**

- Extend to the proposed 14-day mission.
- Add the five Lunar event families listed in section 4.
- Implement seeded weekly selection, forecasts, cooldowns, and event persistence.
- Add repair parts and equipment condition only where the implemented events consume them.
- Add short animations and source-backed explanations for each family.
- Add a mission log linking decisions to later effects.
- Add final results for crew safety, supply readiness, and optional science progress.

**Acceptance**

- Every Lunar event is reachable through a reproducible scenario or seed.
- Random selection produces valid, recoverable starting situations.
- Event effects occur exactly once across save/load and repeated clicks.
- Multiple runs expose different decisions and coherent consequences.
- A final-day event resolves under the documented mission rules.

### Phase 4 — Lunar usability and demo readiness

**Deliverables**

- Test with first-time players, including the intended audience when available with appropriate facilitation.
- Check whether players understand the objective, discover the controls, and explain one delayed consequence.
- Refine pacing, text density, difficulty, and resource visibility from observed behavior.
- Verify keyboard, mobile layout, muted play, reduced motion, and static fallback.
- Optimize measured bottlenecks and complete media/source attribution.
- Prepare a short demo route showing one NASA observation, one decision, and its later consequence.

**Acceptance**

- A fresh player can make a meaningful decision and describe its effect.
- The complete Lunar run passes its required checks.
- Record any audience or physical-device testing still pending before making usability claims.
- This milestone provides a complete Lunar deliverable for demonstration.

### Phase 5 — Space Station mode

**Deliverables**

- Reuse the shared simulation, controls, crew, event presentation, and save structure.
- Add a station overview with selectable modules, solar arrays, batteries, greenhouse, and life-support equipment.
- Animate orbital light/shadow changes while summarizing them in the daily budget.
- Introduce station-specific recycling and repair events in a small tutorial.
- Implement the five Station event families from section 4.
- Add scheduled cargo and experiment choices with visible dependencies.
- Retain mode-specific science explanations for microgravity, recycling, and storage.

**Acceptance**

- The full Station run completes with its own environmental rules and objectives.
- Players can explain how battery storage supports operations during eclipse.
- Shared-system changes pass the Lunar regression checks.
- Switching modes loads the correct resources, visuals, events, and save state.

### Phase 6 — Mars mode

**Deliverables**

- Add the Mars landscape, habitat, greenhouse, solar systems, and surface equipment.
- Introduce sols and a multi-sol dust/power forecast.
- Use a verified Mars observation to inform reduced sunlight in a selected scenario.
- Add delayed communications and locally available diagnostic information.
- Implement the five Mars event families from section 4.
- Add supply planning across several sols and mode-specific preparation objectives.
- Finish the three-mode selection and progress view.

**Acceptance**

- Players can prepare before a multi-sol shortage and see the effect of that preparation.
- Communications delays are understandable and allow useful local decisions.
- Sources support the environmental facts and identify scenario assumptions.
- Lunar, Station, and Mars complete through their normal entry points.

### Phase 7 — additional missions and features

Prioritize after the three modes have complete, understandable journeys.

| Candidate | Add when |
| --- | --- |
| Additional event packs | Existing events are understood and replay needs more variety |
| Longer expeditions | Daily pacing and saving are reliable |
| Additional facilities and upgrades | A new facility creates a meaningful resource decision |
| Crew development | Players already understand the five core roles |
| Site selection | Verified environmental differences can change the simulation |
| Classroom missions | Teachers or facilitators identify a concrete learning need |
| More voice acting and cinematic sequences | Core decisions and explanations remain easy to follow |

## 9. Implementation structure and verification

### Suggested code responsibilities

- `src/mission/` — shared state, daily transition, forecasts, event selection, outcome rules, persistence.
- `src/data/` — mode settings, crew definitions, authored dialogue, challenge records, source records.
- `src/ui/` — daily HUD, facility controls, crew assignments, challenge panel, dialogue, reports.
- `src/scenes/` — shared visual helpers and separate mode scenes where appropriate.
- `src/audio/` — existing audio manager extended through committed events.
- `public/media/` — optimized GIFs, posters, portraits, and verified reference imagery.
- `tests/` — meaningful rule and integration regression cases.

Create files as their responsibilities become necessary. Keep simulation results independent of animation and media loading.

### Transition consistency

1. Validate the draft and identify the current scheduled event.
2. Resolve generation, demand, reserve use, tasks, and crop progression in a documented order.
3. Evaluate thresholds and mission outcomes at the relevant internal steps.
4. Produce one next state and one result report.
5. Save the committed state and present its effects.

- Include capacity limits, unmet demand, and life-support priority in the rule specification.
- Preserve intra-day shortages in the outcome even if later generation restores the battery.
- Give commits an identity so duplicate actions and presentation callbacks cannot advance time twice.
- Store the event seed/state, assigned tasks, active event progress, and schema version in saves.
- Cancel obsolete radio and animation work on retry or mode change.
- Use future-event uncertainty honestly in previews. Show known costs exactly and uncertain conditions as forecasts.

### Required checks by milestone

- Run existing tests and the production build after relevant changes.
- Add focused coverage for resource accounting, delayed harvests, deterministic event selection, duplicate commits, save/load, and mode-specific rules.
- Verify the complete user journey in a browser at each playable milestone.
- Exercise media failure, reduced motion, audio blocked/muted, keyboard navigation, narrow layouts, and static fallback.
- Check each event's ordinary, partial recovery, and interruption outcomes.
- Re-run shared-mode regression checks when changing the common simulation.
- Record which checks passed and which require a physical device or participant.

## 10. Visual assets and 3D performance

### Production approach

- Extend existing procedural Three.js models for reusable equipment and interactions.
- Use shared geometry/materials for the five astronauts, with readable identity accents.
- Add glTF models or an external modeling tool when a required object benefits from authored geometry or animation.
- Generate or source portraits and explanatory images in a coherent visual style.
- Create animated problem media from a controlled 3D sequence or a reviewed illustration sequence.
- Register every external or generated asset with creator/source, usage rights, attribution, and purpose.

### Initial performance targets

These are measurement targets for the project and may be revised after profiling.

| Area | Starting target or technique |
| --- | --- |
| Rendering | Aim for 30 fps on the tested mid-range mobile device and 60 fps on desktop |
| Resolution | Cap pixel ratio and lower quality on constrained devices |
| Scene detail | Reuse geometry, limit real-time shadow casters, reduce distant detail |
| Textures | Begin with 512–1024 px textures where visually sufficient |
| Challenge GIF | 3–6 seconds, modest resolution/frame rate, target roughly 1 MB or less where legible |
| Posters and portraits | Compressed images sized for their displayed dimensions |
| Loading | Load the active mode and preload the next relevant event media |
| Background work | Pause rendering, loops, and audio when hidden |
| Cleanup | Dispose mode-specific geometry, textures, and media on mode change |

- Confirm frame time and asset size with actual measurements.
- Choose media compression based on legibility of the depicted problem.
- Keep the still fallback and structured explanation functional throughout loading.

## 11. AI model usage and token optimization

### Development model allocation

Choose among models actually available in the implementation chat. Record the selection and escalate based on the work.

| Work | Model capability needed | Escalation trigger |
| --- | --- | --- |
| Simulation design, save consistency, scientific interpretation | Strong reasoning model | Use for initial design and decisions with cross-system effects |
| Feature implementation within agreed interfaces | General coding model | Move to stronger reasoning for ambiguous state behavior or repeated failures |
| Small copy edits, content tables, bounded styling changes | Lower-cost model when available | Escalate when the change affects behavior or requires broader context |
| Image generation | Image-capable tool for approved visual needs | Generate additional variants only after reviewing the first asset |
| Integration review | Strong reasoning model with the relevant diff and test results | Focus on cross-file behavior and unresolved risks |

- Use one active implementation agent by default. Additional agents require an explicit delegation request in the implementation chat or applicable instructions.
- Work one phase at a time, with the current acceptance criteria included in context.
- Read targeted files and symbols using `rg`; reuse earlier findings while they remain current.
- Provide bounded tool output and summarize lengthy test logs.
- Send an implementation model the current task, relevant files, agreed interfaces, and concrete failure output.
- Retain a short handoff record in this plan after each phase, containing completed work, changed files, checks, known issues, and the next phase.
- Record observed token usage or cost only when the tool exposes it. Budget estimates should be labeled estimates.
- Set a per-phase token budget only if the user requests a numerical budget. Evaluate cost alongside correctness and rework.

### Game runtime

- Ship authored dialogue and deterministic simulation locally.
- Use verified variable substitution for state-aware replies.
- Bundle selected NASA records with attribution for reproducible scenarios.
- The initial game design requires zero language-model tokens during play.
- Consider live AI dialogue in a later feature phase if a concrete learning benefit justifies generation cost, latency, and factual review.

## 12. Scientific references and source handling

| Reference | Intended use |
| --- | --- |
| [Official challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) | Confirm audience, objectives, and submission-facing description |
| [Official resources tab](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=resources) | Recheck the current resource list before expanding datasets |
| [HackAthlone challenge copy](https://hackathlone.com/challenges/junior-astronaut-mission-trainer) | Supplementary full brief and resource listing consulted during analysis |
| [Archived DONKI event](https://ccmc.gsfc.nasa.gov/DONKI/events/30717/1/) | Historical particle-event context already used by the prototype |
| [NASA lunar environment](https://www.nasa.gov/reference/moonbase-environment/) | Site-dependent lighting, terrain, and thermal context |
| [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) | Air and water system functions |
| [NASA growing plants in space](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/) | Crop needs and supplemental food context |
| [NASA ISS solar arrays](https://www.nasa.gov/image-article/solar-arrays-international-space-station/) | Sunlight, battery charging, and eclipse operation |
| [NASA Mars light and energy](https://science.nasa.gov/resource/on-mars-light-is-energy/) | Observed dust opacity and solar-energy consequences |
| [NASA space communications](https://www.nasa.gov/missions/tech-demonstration/space-communications-7-things-you-need-to-know/) | Distance-dependent communications delays |
| [OSDR](https://science.nasa.gov/biological-physical/data/osdr/) and [RadLab](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) | Candidate biological research and radiation records for later explanations |

- The official resources tab could not be retrieved during the prior analysis. Its current contents still need direct verification.
- Verify each selected primary record before implementing a numerical mechanic.
- Record observed quantity, units, instrument/location, date, retrieval method, source link, and transformation into gameplay.
- Explain game-unit costs and training time compression within the science details.
- Review radiation data against its measurement location before applying it to a fictional outpost.

## 13. Copy into the new chat

> Implement the approved survival expansion in `SURVIVAL_GAME_PHASED_PLAN.md` in this repository. Start with Phase 0 and Phase 1, then stop at the playable seven-day Lunar milestone with its verification results and a concise handoff. Follow the overall sequence of complete Lunar experience, Space Station, Mars, then additional missions. Preserve the established visual identity while making controls prominent and gamified. Use structured game text, five specialist astronauts in the crew phase, and a problem GIF followed by the complete structured explanation and engaging dialogue for each challenge. Follow the model/token and 3D performance guidance. Inspect and preserve the current working tree. Use the proposed defaults unless repository evidence requires a documented adjustment.

### Phase handoff record

- Completed phases — Phase 0 baseline, Phase 1 basic Lunar daily survival, and Phase 2 Lunar crew, visuals, and dialogue.
- Playable milestone — seven-day Lunar run with forecasts, End Day, delayed harvest, water recovery, daily reports, readiness results, and persistent retry/resume. Five specialists now have tasks, readiness, portraits, world models, and dialogue. The storm briefing includes a looping GIF, still fallback, and shelter options.
- Changed areas — daily rules and save journal in `src/mission/`, the HUD and facility controls in `index.html` and `src/ui/`, and committed presentation in the existing outpost scene and soundtrack.
- Checks — 15 rule tests, production build, complete desktop crew and shelter run, legacy-save migration, and narrow-screen reduced-motion and missing-media checks. [Rules, baseline and verification](docs/LUNAR_SURVIVAL_VALIDATION.md).
- Tuning still pending — first-time player pacing and resource balance, physical-device performance, and listening checks.
- Next phase — extend Lunar to 14 days and add seeded, replayable weekly events and a mission log.
