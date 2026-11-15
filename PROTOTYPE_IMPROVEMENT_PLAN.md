# Lunar outpost: prototype improvement plan

> **Historical reference.** Historical playtest and implementation plan for the two-shift storm drill. Its balance, controls, and acceptance results describe that prototype. See the [current game overview](docs/GAME_OVERVIEW.md) and [campaign validation](docs/CAMPAIGN_VALIDATION.md).

Prepared 14 November 2026 after playing the local build. **Status: Phase 1 prototype implementation complete.** The P0 and P1 work below is implemented, along with the P2 peak demand and alternate scenario. Player usability sessions and physical-device audio checks remain open; see [validation](docs/PROTOTYPE_VALIDATION.md). Preserve the existing 3D base and accessible HTML controls. Target the existing ages 7–12 audience and a 3–5 minute first session.

## 1. Playtest evidence

Tested the complete opening, all three building panels, a forecast request, two completed runs, and retry in the desktop in-app browser. This is one evaluator's review, not audience research. Mobile, audio, reduced motion, and failure paths were not manually tested.

| Observed | Why it matters |
| --- | --- |
| Three button presses advance static cabin dialogue before the animated approach. | The player's first activity is dismissing exposition; the strongest environment arrives late. |
| The photo-style cabin, simple orbital approach, and detailed stylized base have different visual treatments. | The opening feels separate from the actual game. |
| Unchanged default settings win: 2 battery, 3 air, 2 harvest remain. | The player can finish without interpreting evidence or making a decision. |
| Turning the farm off for both shifts also wins: 4 battery, 3 air, 0 harvest. | The farm is optional expenditure with no demonstrated payoff. |
| The tower provides location and air dropdowns but no storm telemetry. | The natural command location cannot answer “What is happening?” |
| The forecast says the storm lasts through shift 2, which the HUD and subsequent report already imply/reveal. | Communications adds little decision value. |
| Running a shift immediately updates resources; the visible report starts collapsed. | The player cannot watch their preparation work, and key consequences are easy to miss. |
| At the tested viewport, the tower panel covered the communications marker; closing it restored access. | Building navigation needs to remain available when panels are open. |

Code review confirms that harvest only accumulates, success checks exposure and air, and the scene receives grow-light settings but no committed storm state. Crew figures are hidden after arrival. These are underlying system gaps, not just missing dialogue.

## 2. Design goal

**“I understood the warning, protected my crew, and kept the outpost ready for tomorrow.”**

The central loop should be: observe a changing condition → weigh a resource tradeoff → commit → see the consequence → adapt. Keep two main decision rounds for this prototype; add a short recovery payoff instead of more buildings or a larger map.

## 3. Replace the opening with an incident in the playable world

Use the existing outpost scene, lander, crew models, and camera throughout. Remove the static cabin from the default opening. Avoid spending this iteration on a new cockpit or elaborate cinematic.

| Target elapsed time | Experience |
| --- | --- |
| 0–8 seconds | Open on the lander settling at the existing base. The greenhouse glows; crew move toward the habitat. A short radio line establishes arrival. |
| 8–15 seconds | The tower beacon changes and an instrument alert appears: “Particle readings rising.” Camera settles into the playable view. |
| By 15 seconds | Player can select buildings. Tower shows the situation and the mission goal; no Continue chain. |
| 15–45 seconds | Inspect the tower and farm, optionally request forecast details, and make the first allocation. Contextual explanations appear beside the relevant control. |

Example opening radio: “Welcome to the outpost. The greenhouse is almost ready for its next harvest.” Then: “Tower here. Particle readings are rising. Checking the shelter systems.” Each message should fit in one short caption. Optional voice can follow later; captions must carry the experience.

Keep Skip and reduced-motion paths. Skip goes straight to the same alert state without bypassing mission information. Do not require precisely timed input during the arrival.

## 4. Make the Control Tower the situation room

The tower should answer four questions in this order:

1. **What is the storm?** “Fast-moving particles from the Sun can harm astronauts. Thick shelter walls help protect the crew.”
2. **What is happening now?** Phase, particle-risk trend, crew protection, battery remaining, and latest forecast age.
3. **Why does it matter?** A short interpretation tied to the player's current state.
4. **What choices are available?** Location and air controls with clear costs, consequences, and a contextual hint if needed.

Proposed compact display:

> STORM: RISING → PEAK EXPECTED NEXT SHIFT  
> Crew: shelter ready · Air reserve: 3 units  
> Battery: 10 units · Draft shift cost: 4 units  
> Farm: next harvest needs more light  
> Tower note: “The crew and greenhouse share this battery. The peak is still ahead.”

Use qualitative risk levels initially. Any numerical risk index must be explicitly a simulated game scale, with a readable legend. “Current data” means current scenario telemetry; keep historical NASA evidence in a separate expandable source panel. Do not present the archived event as a live lunar measurement.

Give Communications a distinct purpose: receiving updated forecasts and explaining their origin. A reply must update the tower and show a persistent notification even when the communications panel is closed. For the first scenario, the reply can reveal the next phase's system demand and expected duration; essential survival information must remain available without waiting for the reply.

### Hints that preserve agency

| Situation | Suggested hint |
| --- | --- |
| Player has not selected protection | “The standard habitat has less shielding. Particle readings are still climbing.” |
| Draft leaves little battery | “This plan is affordable now. What will remain for the peak?” |
| Farm has been ignored | “The greenhouse is drawing no light power. Tomorrow's harvest target is slipping.” |
| Player uses reserve air again | “Reserve air saves power, but this tank was already used last shift.” |
| Player opens help | Explain one tradeoff with a diagram or sentence; show an explicit suggested action only on a second help request. |

Keep immediate air/exposure warnings explicit. Hints should leave strategy open, not obscure important consequences. Trigger them on state changes or requests, with cooldowns, rather than repeating continuously.

## 5. Give the storm a visible progression

Use four named phases: **Warning → Rising → Peak → Recovery**. Warning is the arrival and planning setup; Rising and Peak are the two playable shifts; Recovery is the payoff. These are simulation phases, not a claim about the timing of the archived event.

After a commitment, play a skippable 5–8 second resolution on the base:

- Crew move into their selected building; the tower beacon and shelter-status marker update.
- A small instrument trace shows risk rising; the phase label changes.
- Resource flows animate from the shared power supply to air circulation and farm lights.
- Counters settle at their calculated values; one radio line explains the most important consequence.
- Show a persistent, already-expanded one-sentence result before the next choice. Detailed accounting can remain collapsible.

Maintain a calm lunar landscape: communicate an otherwise invisible hazard through instruments, facility response, and crew behavior. Do not depict a solar particle event as wind, rain, lightning, or a visible dust front. If a particle visualization is added, label it as an instrument overlay.

Draft changes should be labeled previews; actual crew relocation and resource consumption occur only on commitment. Lock duplicate commits during resolution and retain a skip-animation control. Planning should not have a countdown for this audience.

## 6. Make harvesting matter without inventing instant crops

For the smallest useful improvement, retain the existing crop-point calculation but connect it to a clear secondary objective: **prepare at least 3 harvest points for tomorrow's fresh-food supplement**. Display the target before the first allocation. This threshold is a proposed balance value.

Rename the meter to “Tomorrow's harvest” and show crop condition, expected output, and the effect of each light setting in the farm panel. Establish that the plants are already growing before the mission. After the storm, use a clearly labeled “Later…” recovery beat to show harvesting, delivery to the habitat, and the crew receiving fresh food. Translate points into a fictional food-contribution display; avoid claiming a real yield or complete nutritional provision.

Differentiate outcomes:

- **Crew protected; harvest secured:** both objectives achieved, followed by the food-delivery payoff.
- **Crew protected; harvest delayed:** survival success, but a visibly smaller/delayed fresh-food contribution. Stored provisions keep the crew fed; invite a retry to improve the farm outcome.
- **Training interrupted:** air or exposure problem, explained through the causal sequence rather than blame.

Crop output must not compensate for unsafe crew conditions. Do not introduce food as instantaneous oxygen, battery charge, or radiation protection.

### Initial balance experiment using existing rules

| Two-shift strategy, sheltered throughout | Final battery / air / harvest | Proposed result |
| --- | --- | --- |
| Normal air + dim lights twice | 2 / 3 / 2 | Crew protected; harvest target missed |
| Normal air + full lights once, dim once | 0 / 3 / 3 | Both objectives met; no spare battery |
| Reserve air + full once; normal air + dim once | 1 / 1 / 3 | Both objectives met; less spare air |
| Normal air + lights off twice | 4 / 3 / 0 | Crew protected; harvest delayed |

These values follow the current equations; they are starting hypotheses, not a finished balance. Do not also require spare battery without rebalancing. Because the two shifts currently have identical costs, order barely matters. Once the basic feedback works, add one clearly announced phase-specific demand (for example, extra ventilation demand in the fictional scenario) and retune the budget. Test that at least two understandable strategies still meet both objectives. Avoid unexplained random penalties.

## 7. Music and sound direction

Use an instrumental, adaptive score to connect arrival, uncertainty, problem-solving, and relief. The mood should be curious and adventurous, with gentle tension suitable for ages 7–12. Use warm synth pads, a simple memorable melody, soft electronic pulses, and restrained percussion. Keep enough space for reading and thinking; avoid vocals and constant alarms.

| Moment | Music direction | Supporting sound and purpose |
| --- | --- | --- |
| Arrival, first 0–8 seconds | Introduce a short hopeful motif over an airy pad, continuing seamlessly into the base. | A restrained cinematic landing cue and cabin/radio sounds establish arrival without adding another screen. |
| Warning and first planning round | Thin the melody and introduce a quiet, slow pulse when the tower alert appears. Hold a stable loop while the player thinks. | One recognizable alert chime, paired with the visible warning; a short radio connection cue. |
| Rising storm, shift resolution | Add a rhythmic layer as the committed plan executes. | Shelter-door confirmation, equipment activation, and subtle resource-transfer cues reinforce visible consequences. |
| Peak and second planning round | Add harmonic tension and a slightly stronger pulse; lower intensity again during deliberation. | Distinct forecast-received cue, also shown as a persistent visual notification. Avoid a ticking-clock implication because planning has no timer. |
| Recovery and harvest delivery | Return to the arrival motif with warmer harmony. Add a short melodic flourish when the harvest reaches the habitat. | Gentle delivery and crew acknowledgment cues make the food payoff tangible. |
| Crew protected, harvest delayed | Resolve the safety tension but use a quieter, incomplete version of the harvest motif. | The debrief explains the missed crop target; music must not imply that the crew died or that survival was a failure. |
| Training interrupted | Brief, soft unresolved cadence, then a calm debrief bed. | No harsh failure buzzer; keep the invitation to retry encouraging. |

### Prototype audio scope

- Create one cohesive 45–60 second looping composition with three synchronized layers: ambient foundation, gentle pulse, and peak tension. Add a short arrival/recovery motif and two brief outcome variations. Reuse the musical theme instead of commissioning a separate track for every building.
- Start with about six short effects: interface confirmation, tower warning, forecast received, shelter secured, resource allocation, and harvest delivery. Facility ambience is optional polish after the music and mission cues work.
- Crossfade layers over roughly 1–2 seconds as committed mission phases change. Selecting buildings or editing a draft must not restart the soundtrack or trigger a success cue. Avoid rapid musical switching when a player explores options.
- Treat music as a cinematic score and equipment sounds as interface, radio, or interior cues. Do not suggest that the solar storm itself makes an audible roar across the lunar surface.
- Use original or appropriately licensed audio; record creator, source, license, and required attribution in an asset register. Bundle the small audio set with the game so the prototype does not depend on a streaming service. Asset selection and production are implementation work, not completed by this plan.

### Controls and implementation behavior

Offer **Start with sound** and **Play muted** on the initial launch overlay over the 3D scene; this replaces any need for a separate audio tutorial. Begin playback after the player's start interaction. If playback is unavailable, proceed silently with the same captions and visual alerts.

Provide a persistent mute control and separate Music and Effects volume sliders, with conservative initial levels. Remember the player's settings locally. If voice is added later, give it a separate control and lower music while it plays. Keep essential information available in text; no objective, warning, or forecast may depend on hearing a cue.

Add a small audio manager, proposed as `src/audio/missionAudio.ts`, that consumes the same committed phase and outcome events as the scene. It should own loop playback, layer gains, transitions, and one-shot cue deduplication. Pause audio when the page is hidden; resume only when appropriate to the player's sound setting. Retry must cancel old transitions and cues before restarting the mission bed. Skip intro should transition into the current phase without replaying the arrival sting. Audio loading or playback failure must never block a shift.

## 8. Implementation order and scope

| Priority and status | Work | Main files | Exit condition |
| --- | --- | --- | --- |
| P0 — Stakes and clarity · Implemented | Add explicit objectives, crop target, differentiated outcomes, tower situation panel, and contextual hints. Show key shift result by default. | `src/mission/solarStorm.ts`, `src/ui/missionControls.ts`, `src/ui/missionRadio.ts`, `index.html` | Player can explain storm, crew risk, and harvest purpose before committing; farm-off no longer earns the full mission result. |
| P1 — World continuity · Implemented | Replace cabin flow with direct base arrival and alert. Keep crew visible as needed. Add state-driven storm resolution and recovery harvest delivery. | `src/ui/flightIntro.ts`, `src/scenes/OutpostScene.ts`, `src/scenes/flightModels.ts` | First interaction within 15 seconds; each commitment produces visible cause and effect in the same world. |
| P1 — Music and mission cues · Implemented | Add the adaptive score, six core sound effects, sound-start choice, mute/volume controls, and phase/outcome transitions. | `src/audio/missionAudio.ts`, `public/audio/`, mission/intro UI, `index.html` | Arrival, storm, and recovery have a cohesive musical arc; sound never blocks play or carries essential information alone. |
| P1 — Navigation · Implemented | Keep building tabs available inside the panel; prevent panel/marker occlusion; retain keyboard routes and text status. | `src/ui/buildingControls.ts`, `src/styles.css`, `index.html` | Every facility remains reachable without hunting behind overlays, including narrow layouts. |
| P2 — Adaptation and replay · Implemented | Add the announced phase-specific demand, meaningful forecast update, and one selectable alternate scenario. | Mission configuration, rules, radio, debrief | Second round changes the decision; replay supports an intentional alternative strategy. |

Implement a single source of mission state for phase, resources, crew protection, crop outlook, and objectives. Pure rule functions produce both the preview and committed outcome. A separate presentation layer consumes committed events such as `crewSheltered`, `powerSpent`, `cropProgressed`, and `stormPhaseChanged`; animations must not determine simulation results. Keep draft and committed state separate. Retry must clear pending radio replies, animation callbacks, and scenario state.

P0 and P1 are implemented as the prototype milestone. Defer additional planets, new buildings, walking controls, live NASA integration, complex inventories, and elaborate voice acting until this loop tests well.

## 9. Validation and acceptance

Functional checks during implementation: default and farm-off paths; both crop-target strategies; exposure and air failure; unaffordable plans; forecast arrival while another panel is open; duplicate commit prevention; skip during resolution; retry during pending callbacks; reduced motion; static fallback; keyboard-only and narrow-screen navigation. Check that previews match committed values and all full-success paths protect the crew.

Audio checks: start with sound and muted; blocked playback; missing audio files; independent volume controls; saved settings; clean looping and crossfades; rapid panel switching; skip and retry during a cue; background-tab pause/resume; no duplicate music layers or repeated alerts. Check desktop and mobile browsers, headphones, and built-in speakers. Complete a full run muted to confirm information parity. In player sessions, ask whether music helped identify the storm and recovery, and whether it distracted from reading or made planning feel timed. Adjust intensity if it creates pressure without improving understanding.

**Pending usability validation:** test with five first-time players from the intended audience, with appropriate adult facilitation. Ask neutral questions rather than teaching the solution:

- After 30 seconds: “What is happening, and what are you trying to protect?”
- Before committing: “What do you think will happen to the farm?”
- After shift one: “What changed? What will you do next?”
- At the end: “What was the harvest used for? What would you try differently?”

Proposed acceptance targets: four of five explain the storm and food objective; four of five notice the first shift's consequence without opening extra details; at least three can describe a deliberate tradeoff and an alternative replay strategy. Treat these as small-sample usability gates, not statistical proof. Record time to first meaningful interaction, missed alerts, misunderstood meters, and unassisted completion. Revisit balance if everyone repeats the same solution or succeeds without understanding it.

## 10. Science boundaries and references

The game's budgets, phase duration, forecast, crop target, and outcome thresholds remain fictional simplifications. Solar radiation hazards and shielding should be explained consistently with [NASA's lunar radiation overview](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/). Space-grown crops provide supplemental fresh food; the farm payoff follows that framing from [NASA's Growing Plants in Space](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/). Keep source details accessible without placing them in the main decision flow.
