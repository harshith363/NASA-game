# ECHOES: The Last Archive — Phase 1 Implementation Blueprint

**Status:** Codex-ready specification · **Version:** 1.0 · **Date:** 2026-11-13  
**Format:** Web-based cinematic interactive narrative / educational investigation game  
**Target audience:** Ages 10–14, with a cinematic presentation engaging for adults  
**MVP playtime:** ~10 minutes (typical first playthrough, excluding optional archive browsing)  
**Full-story target:** ~45 minutes across four stages: Earth, Moon, Mars, Beyond  
**Working title:** ECHOES: The Last Archive

> **For Codex:** Treat this document as the implementation source of truth. Build a fully playable, self-contained Phase 1 web app with polished placeholders if real or generated visual assets are not yet available. Do not invent historical NASA facts or quietly replace missing real NASA photos with labeled historical-looking AI images. Preserve the scene IDs, dialogue meaning, state transitions, educational outcomes, and test criteria. Prioritize the complete 10-minute playable story over advanced effects.

---

## 1. The product in one paragraph

In a **fictional future, 2047**, four students travel aboard the interplanetary educational spacecraft **Odyssey**, en route from Earth to Mars. Their on-board archive AI, **ECHO**, challenges them to restore a nearly forgotten collection of historic NASA hardware. During a fictional lunar flyby and later through mission-record simulations, players discover the actual hardware left at the Apollo 11 landing site and the remarkable story of NASA's Opportunity rover, which remains on Mars after losing contact in 2018. They investigate photographs, piece together scientific evidence, and conclude with a message to future explorers. An independent map-based Archive mode presents the hardware, its location, operational status, discoveries, and sources. Historical evidence is authentic; the spacecraft, student characters, dialogue, and archive framing are fictional.

### Gameplay thesis

**Don't train players to run a Mars outpost. Ask them to investigate what earlier explorers left behind and why those artifacts matter.** Puzzles should test observation, evidence interpretation, chronology, and scientific reasoning—not resource-management survival, combat, or spacecraft repair.

### Official challenge alignment

NASA Space Apps Challenge 2026: **“Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars.”** Its objective is to communicate the stories of hardware left across the solar system, their science, and their varying statuses to school-age enthusiasts. [CH1](#references-and-research-links). This is different from the *Junior Astronaut Mission Trainer* challenge's outpost-management focus. [CH2](#references-and-research-links).

Phase 1 MUST answer, for **each highlighted artifact**:
1. What is it and where is it?
2. Why did NASA send/build it?
3. What did it make possible or discover?
4. Why was it left there, or why did its mission end?
5. What is its current known status, as of the historical record? (For a story set in 2047, avoid claiming unknown developments between 2026 and 2047.)

---

## 2. Non-negotiable design decisions

- Setting: **2047 is clearly fictional**, not a NASA prediction or an actual human Mars flight schedule.
- Age range: accessible language for ages 10–14; no patronizing tone; crisp optional science detail for older players.
- Runtime: **10-minute target**, but allow players to proceed at their own pace. Never force long unskippable cutscenes.
- Story shape: **Earth (2 min) → Moon (2 min) → Mars (5 min) → Beyond/epilogue (1 min)**. Beyond is a *look outward from Mars* / archive-teaser scene, **not** a physical journey past Mars.
- Actual history appears within simulations, visual archives, and records. Students stay aboard Odyssey throughout the MVP; they do not physically land at Apollo 11 or stand next to Opportunity.
- Fictional problems are gentle investigative prompts: damaged chronology labels and incomplete captions in the ship's *curatorial* archive. **No life-support emergency, orbital debris dodging, arbitrary spacecraft danger, or fake historical distress messages in the MVP.** These would distract from the chosen challenge.
- One main puzzle per artifact, with clues and no hard fail states. Historical events are **not altered by gameplay**.
- Real NASA images are clearly labeled “NASA archival photograph/image”; fictional images are labeled “Artist's illustration / fictional 2047 scene.”
- Every historical claim in UI links to a NASA source and every media item has a credit and usage review status.
- Archive Explorer is accessible from the main menu **without finishing the story**; playthrough also unlocks **“restored” badges**, not exclusive access to facts.
- Desktop first, responsive on mobile. Keyboard-accessible core interactions. Reduced-motion and captions supported.

---

## 3. Story world and characters

### Future setting

The year is 2047. Odyssey is a **fictional** passenger research craft taking four students on a special educational mission from Earth to Mars. The interplanetary cruise is compressed via cinematic transitions and a visual “days later” treatment. A lunar flyby is a **fictional route choice** for the story, not a standard required trajectory to Mars. Orbital mechanics are not simulated.

### Main cast

| Character | Age | Role / voice | Use in Phase 1 |
|---|---:|---|---|
| **Ari** | 13 | Main viewpoint; curious, sometimes impatient, asks the audience's questions | Primary protagonist and selected response options |
| **Maya** | 14 | Observant, science-minded, interprets evidence carefully | Prompts evidence-based thinking |
| **Leo** | 13 | Playful, visually imaginative, quick to jump to conclusions | Creates opportunities for corrections without embarrassment |
| **Sam** | 14 | History-minded, thoughtful, sees the human significance of hardware | Gives emotional stakes to the archive |
| **ECHO** | AI | Calm, precise, sometimes unexpectedly poetic, but never a sentient reincarnated rover | Narrator, evidence guide, archive host |

**Portrait policy:** Characters can be shown as silhouettes or lightly stylized illustrated portraits to minimize art requirements. Keep appearances consistent via a reusable design sheet. Narration can be caption-only in MVP; voice-over is optional.

### Core premise / mystery

Odyssey carries a **Legacy Archive**: a structured educational collection of historical machines with excellent raw records but missing *interpretive captions*. A previous generation left a final curatorial question: **“What makes a mission worth remembering?”** Students choose to assemble a small new exhibition. The “mystery” is **not** a fabricated NASA transmission. It is a fictional educational framing question.

### Repeating narrative motif

**“Left behind ≠ forgotten.”** Every historical scene juxtaposes an inactive physical object with continuing scientific and human impact.

---

## 4. 10-minute MVP story — complete beat-by-beat screenplay

### Runtime budget

| Scene ID | Stage | Content | Target |
|---|---|---|---:|
| `E00` | Earth | Title, accessibility/Start, cinematic launch establishing shot | 0:30 |
| `E01` | Earth | Students meet ECHO; uncover the Legacy Archive question | 1:30 |
| `L01` | Moon | Lunar flyby and authentic Apollo landing-site reveal | 0:40 |
| `L02` | Moon | Apollo artifact identification puzzle and resolution | 1:20 |
| `M01` | Mars | Transition and Opportunity introduction | 0:45 |
| `M02` | Mars | Opportunity science evidence puzzle | 2:15 |
| `M03` | Mars | 2018 dust storm, final silence, evidence-based ending | 2:00 |
| `B01` | Beyond | Legacy constellation and closing message | 1:00 |
| **TOTAL** | | | **10:00** |

**Timing note:** These are pacing targets, not forced timers. Read speed varies; provide **skip animation**, **back**, and **replay scene** functions. Never auto-advance dialogue before the player has time to read.

### `E00` — Opening cinematic: “The distance between worlds” (00:00–00:30)

**Visual:** AI-generated wide exterior of Odyssey departing the blue Earth, 2047 title treatment, quiet music, stars; subtle camera push. **Do not place NASA logos on fictional ship.**

**On-screen:** `2047 · EARTH ORBIT` / `ODYSSEY — STUDENT EXPEDITION TO MARS` / `A fictional future. A real history.`

**Caption/narration:** “Every journey begins long before the travelers arrive.”

**Interaction:** `Begin Journey` button; `Explore Archive` secondary link. Respect reduced motion: show still image if needed.

**Exit:** tap Begin → `E01`.

### `E01` — Prologue: “An unfinished story” (00:30–02:00)

**Visual:** Illustrated Odyssey panoramic observation lounge, Earth visible behind the glass. Character portraits appear on dialogue. ECHO appears as a restrained luminous ring or waveform.

**Script (use these lines; minor punctuation edits allowed):**

1. **Leo:** “Mars. We're actually going to Mars.”
2. **Maya:** “First, weeks of travel. And a lot of looking out this window.”
3. **Ari:** “I can live with that view.”
4. **Sam:** “Do you ever wonder who made a journey like this possible?”
5. **ECHO:** “I have a collection you may find interesting. It is called the Legacy Archive.”
6. **Ari:** “What does it collect?”
7. **ECHO:** “Machines humanity sent into space—and, in some cases, never brought home.”
8. **Leo:** “So... old space junk?”
9. **ECHO:** “Some are historic artifacts. Others recorded discoveries that changed our understanding of entire worlds.”
10. **Sam:** “Then why does this archive say 'INCOMPLETE'?”
11. **ECHO:** “The images survived. The mission logs survived. But the stories connecting them have not yet been written.”
12. **Maya:** “Then let's find the evidence and write those stories.”
13. **ECHO:** “First stop: a place close enough to see, and far enough to change history.”

**Interaction:** single choice (nonbranching; affects one response line only):
- `“Show me what was left behind.”` → ECHO: “We begin with the Moon.”
- `“Show me why it mattered.”` → ECHO: “That is exactly the question.”

Both lead to `L01`. Choice can be stored for flavor only.

**Knowledge setup:** Introduce the **Archive Card** format: `Artifact / Location / Mission / Science / Status / Sources`.

### `L01` — Lunar flyby: “The place we didn't take home” (02:00–02:40)

**Visual:** Fictional exterior Odyssey flying past Moon, then dissolve to **real LRO orbital image of Apollo 11 landing site** (with credit). Slow annotated zoom, no invented close-up surface textures presented as evidence.

**Script:**

1. **Sam:** “We can see the Moon. Could we see the landing sites?”
2. **ECHO:** “From here, not with the naked eye. But NASA's Lunar Reconnaissance Orbiter photographed the Apollo 11 site decades after the landing.”
3. **Maya:** “Something is still there.”
4. **ECHO:** “Yes. Apollo 11's lunar module descent stage remained on the surface.”
5. **Leo:** “Wait—the astronauts left part of their spacecraft behind?”
6. **ECHO:** “They used the ascent stage to depart. The descent stage stayed.”

**Transition:** `Inspect the landing site` → `L02`.

### `L02` — Interactive Moon investigation: “What stayed?” (02:40–04:00)

**Visual:** Split view of **genuine LRO landing-site image** and a **clearly stylized educational schematic** of an Apollo lunar module. Beneath: evidence-choice tiles.

**Goal:** Determine which element of the Apollo 11 lunar module remained on the Moon and why. (Do NOT claim a rover was used on Apollo 11; lunar rovers came later.)

**Puzzle flow:**

1. Show artifact cards `Descent stage`, `Ascent stage`, `Returned lunar samples`.
2. Prompt: `Which major component remained at Tranquility Base?`
3. Correct: `Descent stage`. Incorrect: display clue: “The astronauts needed an engine and cabin to leave the Moon. Which part served as the platform they launched from?” No negative score.
4. Evidence reveal: NASA's image of the site + simplified two-stage diagram; click two hotspots to label `Descent stage stayed` and `Ascent stage departed`.
5. Prompt: `Why did it stay?` Options:
   - `It was the landing platform; the ascent stage lifted off.` **Correct**
   - `It was forgotten by the astronauts.` Incorrect
   - `It was a failed spacecraft.` Incorrect
6. Show micro-conclusion: “The descent stage was part of a successful design—not a mistake left on the Moon.”
7. Present NASA source button and archive card.

**Archive card unlocked:**
- **Name:** Apollo 11 Lunar Module *Eagle* — descent stage
- **Body:** Moon
- **Location:** Sea of Tranquility / Tranquility Base; approximately **0.67409° N, 23.47298° E** (historical landing-site coordinates; do not imply sub-meter location precision)
- **Mission date:** Apollo 11 lunar landing, **July 20, 1969**
- **Why sent:** land the first crew on the Moon and support surface exploration
- **What remains:** descent stage and other artifacts at the landing site
- **Science/legacy:** first crewed lunar landing, collected lunar samples and deployed experiments; site preserves exploration history
- **Operational state:** inactive, left in place
- **Sources:** NASA Apollo 11 overview [N1], NASA Apollo 11 landing-site image [N2], NASA Apollo 11 mission log [N3]

**Closing dialogue:**
- **Ari:** “So it wasn't abandoned because it failed.”
- **Sam:** “It was left because the mission succeeded.”
- **ECHO:** “Archive entry restored: Apollo 11.”

**Exit:** `Continue to Mars` → `M01`.

### `M01` — Mars introduction: “A road no one could walk” (04:00–04:45)

**Visual:** Animated map line from Moon vicinity to Mars, clear time-compression label `MONTHS LATER` (avoid a literal physically inaccurate Moon-to-Mars straight-line travel assertion). Fictional Odyssey approaches Mars; dissolve to real Opportunity mission image and official journey map.

**Script:**

1. **Leo:** “Now *that's* a planet.”
2. **Ari:** “Did humans really explore all of that before we arrived?”
3. **ECHO:** “Robotic explorers did. One was meant to operate for about 90 Martian days.”
4. **Maya:** “And how long did it last?”
5. **ECHO:** “Almost fifteen Earth years.”
6. **Sam:** “Opportunity.”
7. **ECHO:** “It came to Mars to search for clues that water once shaped this world. Let's follow the evidence.”

**Enter:** `Investigate Opportunity` → `M02`.

### `M02` — Main Mars investigation: “Follow the water” (04:45–07:00)

**Visual:** Real Opportunity photograph/panorama, official traverse-map graphic, mission fact cards, gently animated route highlights. This is the MVP's main gameplay.

**Goal:** Assemble a **three-card evidence trail** that explains how Opportunity helped reveal Mars's watery past, while keeping scientific claims accurate and age-appropriate.

**Mechanic:** Drag/tap-to-place cards into chronological/scientific-story slots. **Prefer click-to-select then click-to-place** as an accessible alternative to drag and drop.

**Evidence deck:**
- `A. Rover arrives at Eagle Crater (2004)` / authentic first-site image / correct slot **1: Arrival**.
- `B. Opportunity examines rocks showing evidence of ancient water` / authentic NASA rock image or NASA infographic / correct slot **2: Discovery**.
- `C. Rover explores for years, ultimately traveling 45.16 km` / official traverse map / correct slot **3: Legacy**.

**Player task:** Place A, B, C in order; then answer:
- Question: `What did Opportunity find evidence for?`
- Options: `Past water-related conditions on Mars` **Correct**; `Cities built on Mars`; `Living animals on Mars`.
- On correct: “Evidence in rocks helped scientists understand ancient Martian environments. It did **not** prove that living organisms had been found.”

**Feedback design:** Wrong placements remain movable; hint after two failed tries; `Show reasoning` gives the player the explanation and continues. No false reward for speed.

**Optional science microdetail:** Small “Dig deeper” disclosure: “A *sol* is a Martian day, slightly longer than an Earth day. Opportunity was designed for about 90 sols.”

**Story script after puzzle:**
- **Maya:** “The rover didn't find a Martian ocean. It found clues in the rocks.”
- **ECHO:** “Exactly. Good science often begins by learning what evidence can—and cannot—tell us.”
- **Leo:** “And a 90-day mission kept discovering things for years?”
- **ECHO:** “Nearly fifteen years.”

**Transition to `M03`:** Button `Open final mission record`.

### `M03` — Historical climax: “The last image” (07:00–09:00)

**Visual:** Opportunity archive timeline, real Mars landscape and photo of rover's shadow, cinematic (fictional) dust overlay clearly identified as interpretation, then NASA's **actual June 10, 2018 partial final full-frame Pancam image** with credit and a “Real NASA image” label. **Do not add fabricated transcribed rover speech.** Use a low-key audio fade, not a fake distress signal.

**Script:**

1. **ECHO:** “In June 2018, a planet-wide dust storm darkened the sky above Opportunity.”
2. **Maya:** “Its solar panels couldn't get enough sunlight.”
3. **ECHO:** “The rover's last communication was received on June 10, 2018.”
4. **Ari:** “Was anyone able to reach it again?”
5. **ECHO:** “NASA tried. On February 13, 2019, the mission was declared complete.”
6. **[On-screen NASA archival image, with factual caption]:** “One of Opportunity's last transmitted image products, June 10, 2018. The full-frame transmission was incomplete.”
7. **Sam:** “Then its last chapter was a failure?”
8. **Leo:** “It went farther and lasted longer than anyone expected.”
9. **Maya:** “And it changed what we know about Mars.”
10. **ECHO:** “A mission can end without its discoveries ending.”

**Nuance to honor:** NASA describes the June 10 partial full-frame image as the rover's last *data* sent back, while later thumbnail images were also taken and transmitted. Do not inaccurately call it “the rover's last photograph ever taken.” [N6].

**One-click reflective interaction:** `Choose the museum caption` with three alternatives:
1. `“Opportunity failed after just 90 days.”` → incorrect; explain rover greatly exceeded design life.
2. `“Opportunity proved life exists on Mars.”` → incorrect; explain evidence of past habitable conditions is not a discovery of life.
3. `“Opportunity revealed evidence of Mars's watery past and explored for nearly 15 years.”` → **correct**.

Then show official metrics: landed Jan. 24, 2004; last contact June 10, 2018; declared complete Feb. 13, 2019; drove **45.16 km**; originally designed for **90 sols** [N4].

**Archive card unlocked:**
- **Name:** Mars Exploration Rover — Opportunity (MER-B)
- **Body:** Mars
- **Approximate final region:** Perseverance Valley, near Endeavour Crater; do **not** invent exact coordinate values
- **Mission:** landed Jan. 24, 2004; last contact June 10, 2018; end of mission Feb. 13, 2019
- **Goal:** investigate Martian geology and evidence of past water
- **Achievement:** compelling geological evidence for water-related environments on ancient Mars; traversed 45.16 km
- **Why stopped:** 2018 global dust storm blocked sunlight needed by solar-powered rover; no communication recovered
- **Operational state:** inactive / communications ceased; rover remains on Mars (2019 last historical confirmation, no claim of physical inspection in 2047)
- **Sources:** [N4], [N5], [N6], [N7]

**End dialogue:**
- **Ari:** “We didn't come here to rescue a rover.”
- **Sam:** “We came to remember what it showed us.”
- **ECHO:** “Archive entry restored: Opportunity.”

**Exit:** `Finish the Archive` → `B01`.

### `B01` — Beyond / epilogue: “What we leave behind” (09:00–10:00)

**Visual:** Mars in Odyssey's window, then zoom out to stylized (not physically scaled) solar-system archive. Moon marker and Mars marker illuminate, linked by a golden “legacy” line. Additional distant locations appear as **locked / “coming in later chapters”**, not falsely presented as completed educational content.

**Script:**

1. **ECHO:** “Two entries restored. Two different reasons a machine stopped moving.”
2. **Maya:** “On the Moon, a part was left behind because the mission succeeded.”
3. **Leo:** “On Mars, a rover outlived every expectation—and finally went silent.”
4. **Sam:** “Both left something more important than hardware.”
5. **Ari:** “Knowledge.”
6. **ECHO:** “The archive's question remains: What makes a mission worth remembering?”
7. **[Player chooses one of three valid closing reflections]:**
   - `What it taught us.`
   - `What it made possible.`
   - `The people who kept asking questions.`
8. **ECHO:** “All three belong in the story.”
9. **[Final card]:** `Some missions end. Their discoveries do not.`
10. **[Small label]:** `Odyssey, its crew, and the year-2047 expedition are fictional. NASA mission history and referenced imagery are real.`

**Actions:** `Explore the Archive`, `Replay Story`, `View NASA Sources`.

**Beyond expansion teaser (not playable in Phase 1):** `Future archive: Viking, Ingenuity, Cassini and more`. Keep accurate distinction between Mars-surface remnants, destroyed spacecraft, and dormant deep-space probes.

---

## 5. Gameplay design specifications

### Puzzle `apollo-artifact-v1`

- **Type:** Single-answer evidence identification + hotspot reveal + why-question.
- **States:** `intro`, `identify`, `reveal`, `reason`, `complete`.
- **Winning condition:** descent stage selected and historically correct explanation chosen.
- **Hints:** available instantly; wrong responses present a useful clue, never a penalty.
- **Input:** mouse, touch, keyboard (Tab / Enter / Space).
- **Learning assessment:** distinguish a lander's descent and ascent stages and explain what was left behind.
- **Duration target:** 60–90 sec.

### Puzzle `opportunity-evidence-v1`

- **Type:** Three evidence cards in chronological/narrative order + one multiple-choice interpretation.
- **States:** `intro`, `arrange`, `interpret`, `complete`.
- **Card selection:** accessible click-to-pick and click-to-drop; optional desktop dragging.
- **Hints:** “Start with the landing; finish with the final mission route.”
- **Winning condition:** correct A→B→C and correct scientific interpretation.
- **Learning assessment:** distinguish evidence of past water from proof of extraterrestrial life.
- **Duration target:** 2–3 min.

### Puzzle `opportunity-caption-v1`

- **Type:** One-choice museum caption with corrective feedback.
- **Winning condition:** historically accurate caption selected.
- **Learning assessment:** status ≠ scientific value; design-life ≠ actual lifetime.
- **Duration target:** 20–45 sec, included in `M03`.

### Shared puzzle behavior

- Never block story progression indefinitely: `Show me the explanation` is available after two incorrect attempts or 30 seconds of inactivity (without demanding a timer countdown).
- Never fabricate player control over historical outcomes.
- Save puzzle completion; reopening a mission offers `Replay puzzle`.
- Do not implement points, death, health, fuel, oxygen, power budgeting, or spaceship collision mechanics in MVP.

---

## 6. UI / UX and visual direction

**Aesthetic:** Premium cinematic documentary + interactive museum; dark midnight navy, dusty Mars orange, lunar ivory, subtle archival gold. Scientific clarity over flashy HUD clutter.

**Suggested colors:** background `#07101E`; raised panels `#111E2D`; text `#F4F2ED`; muted text `#BAC6D2`; accent gold `#E7B66B`; Mars orange `#BD674A`; borders `#314559`. Verify WCAG contrast.

**Typography:** Use available open-license web fonts; e.g. Space Grotesk headings and Inter body. Avoid extremely thin or condensed paragraph text. Minimum 16px body on mobile.

**Main screens/routes:**
- `/` landing / new journey / continue / explorer
- `/story` scene player driven by `sceneId` in state (optionally `?scene=...` for debug, not as default progression logic)
- `/archive` solar-system overview with Earth, Moon, Mars, Beyond/locked
- `/archive/apollo-11-descent-stage` real archive detail page
- `/archive/opportunity` real archive detail page
- `/sources` all NASA sources and media credits
- Optional `/about` historical-vs-fictional disclosure

**Global controls:** subtitles/captions on (default), sound toggle (off by default until user enables audio), reduced motion (follow OS and provide explicit setting), restart scene, skip cinematic animations, pause auto-dialogue (dialogue should be manually advanced by default).

**Responsive layouts:**
- 1440px desktop: cinematic art occupying ~60% viewport, dialogue panel in lower third.
- 768px tablet: two-column image and evidence layout, dialogue bottom.
- 390px mobile: stacked image, dialogue and large touch targets; puzzles use taps not tiny hotspots.
- Maintain clear reading hierarchy; no inaccessible text burned into images.

**Archive Map Phase 1:** A stylized **interactive 2D solar-system atlas**, built with SVG/CSS—not a complex 3D simulation. Show Earth (context), Moon (Apollo marker), Mars (Opportunity marker), Beyond (locked teaser). On selecting Moon or Mars, show detail card with verified historical data, location confidence, and direct NASA sources. Never show “live” planetary positions or precision orbital geometry without ephemerides.

**Accessibility:** ARIA labels, visible focus rings, keyboard completeability, prefers-reduced-motion, transcripts for any audio, alt text that distinguishes historical photo from fictional illustration, no reliance on color alone. No animation harder to skip than 1 click.

---

## 7. Asset production checklist: exact filenames and sourcing

**Rule:** Real NASA historical images must come from verified NASA asset pages or other rights-checked official archives. AI images are used for the **fictional** Odyssey and transition scenes, not as falsified documentary evidence. Don't programmatically hotlink unknown images as permanent assets. Download only after verifying image-specific credits and terms. Record final original URL in `assets/manifest.json`.

### 7.1 AI-generated or commissioned artwork — REQUIRED

| Asset ID / local filename | Scene(s) | Content / prompt brief | Format / ratio | Priority |
|---|---|---|---|---|
| `art/odyssey-earth-departure.webp` | E00 | Cinematic wide shot, plausible **fictional** passenger spaceship at Earth orbit, planet filling background, navy/teal, hopeful tone, **no NASA branding, no text** | WebP 16:9 | P0 |
| `art/odyssey-observation-deck.webp` | E01 | Same fictional ship, panoramic observation lounge with Earth outside, silhouettes or consistent portraits of four students age ~13–14, empty lower third for dialogue UI | WebP 16:9 | P0 |
| `art/odyssey-lunar-flyby.webp` | L01 | Wide Odyssey flying past Moon; scale is cinematic, not claimed as physical measurement, matching spacecraft design | WebP 16:9 | P1 |
| `art/odyssey-mars-arrival.webp` | M01 | Odyssey approaching Mars, dramatic limb and atmosphere, scientific but fictional future aesthetic | WebP 16:9 | P0 |
| `art/odyssey-mars-window.webp` | B01 | Quiet emotional final shot, students at window looking at Mars, consistent ship interior, ample dark area for end copy | WebP 16:9 | P0 |
| `art/echo-avatar.webp` | E01 onward | Abstract luminous ring/waveform, non-human AI avatar, transparent/dark background | WebP or SVG | P1 |
| `art/student-ari.webp`, `student-maya.webp`, `student-leo.webp`, `student-sam.webp` | Dialogue | Consistent half-body illustrated portraits, unique clothing/colors/silhouettes, no logos, transparent backgrounds | WebP | P1 |

**Prompt generation note:** Create a single reference sheet of the Odyssey ship exterior and observation deck before generating separate shots, so continuity is maintained. Create a single cast reference sheet before portraits. Ensure visible hands/faces are anatomically plausible; review manually. All final AI assets should be visibly labeled “Fictional illustration” where displayed in the archive/context.

### 7.2 Authentic NASA imagery — REQUIRED (source pages, not assumed direct file URLs)

| Asset ID / local filename | Scene(s) | Verified NASA source to obtain original media | Required factual purpose | Credit |
|---|---|---|---|---|
| `nasa/apollo11-landing-site.jpg` | L01, L02, archive | [N2](#references-and-research-links) https://science.nasa.gov/resource/apollo-11-landing-site/ | Apollo 11 descent stage seen from lunar orbit / actual site | NASA/GSFC/Arizona State University |
| `nasa/apollo11-hardware-context.jpg` | L02 | NASA Apollo 11 lunar surface journal [N1] or log [N3]; find a **specific documented image** and log its original credit | Show authentic LM equipment / surface context | Per chosen asset |
| `nasa/opportunity-rover.jpg` | M01, archive | NASA mission page [N4] and NASA MER media [N8]; use selected asset with known credit | Historical rover identity | Per chosen asset |
| `nasa/opportunity-evidence-rock.jpg` | M02 | NASA MER science/resources [N8]; select actual geological evidence image with clear explanation | Explain rocks evidencing water-related conditions | Per chosen asset |
| `nasa/opportunity-traverse.jpg` | M02, archive | [N7](#references-and-research-links) https://science.nasa.gov/photojournal/opportunitys-final-traverse-map/ | Real final traverse and 45.16 km route | NASA/JPL-Caltech/MSSS |
| `nasa/opportunity-shadow.jpg` | M03 | [N5](#references-and-research-links) https://science.nasa.gov/missions/mer/nasas-opportunity-rover-mission-on-mars-comes-to-end/ | Reflective pre-finale historical photo | NASA/JPL-Caltech |
| `nasa/opportunity-last-image.jpg` | M03 | [N6](#references-and-research-links) https://science.nasa.gov/resource/opportunitys-last-message/ | Actual partial full-frame last downlinked data item | NASA/JPL-Caltech/Cornell/ASU |

**IMPORTANT:** Some table rows refer to a **source gallery rather than a fully selected photograph**. Those asset slots are *research-to-select*, not claims that a particular file has been downloaded. Code should supply a clearly labeled illustration placeholder plus source link until image selection is completed. Never silently use arbitrary third-party media.

### 7.3 Diagrams / illustrations created in code — REQUIRED

| Asset / component | Scene | Description | Delivery |
|---|---|---|---|
| `ApolloModuleDiagram.tsx` | L02 | Original simple SVG diagram: descent vs ascent stage, no false claim of photorealism | Native SVG React |
| `SolarSystemAtlas.tsx` | B01 / `/archive` | Stylized, clearly labeled, non-scale locations and historical object markers | SVG React |
| `OpportunityEvidenceCards.tsx` | M02 | Image/label cards, snap-to-slot interactions, keyboard alternatives | React |
| `MissionTimeline.tsx` | M03 | 2004→2018→2019 historical dates with explanatory notes | React/CSS |
| `ArchiveArtifactCard.tsx` | L02 / M03 / `/archive` | Facts + statuses + citations, data-driven | React |

### 7.4 GIFs / short animations — REQUIRED DESIGN, NOT REQUIRED AS GIF BINARY

Prefer CSS/SVG/React animation or compressed **WebM/MP4** with static fallback over GIF binaries for performance. If marketing requests GIFs, export them from these animation sources. Each should be **3–8 sec** and loop seamlessly unless noted.

| Animation filename or component | Scene(s) | Storyboard / motion | Implementation | Priority |
|---|---|---|---|---|
| `anim/earth-to-moon-route` | E01→L01 | Stylized line lights up Earth → Moon, orbit positions explicitly not to scale | SVG motion | P1 |
| `anim/lunar-site-reveal` | L01 | Crossfade fictional flyby to real LRO image, then subtle annotation pulse | CSS/SVG | P0 |
| `anim/apollo-stages` | L02 | Descent stage stays, ascent stage lifts; 2–3 clear educational beats; **original schematic** | SVG motion | P0 |
| `anim/moon-to-mars-transition` | L02→M01 | Time-compressed route across star field; on-screen `MONTHS LATER` | CSS/SVG | P0 |
| `anim/opportunity-route` | M02 | A line progressively traces route on official map **without misrepresenting the traversed geometry**; if path digitization impossible, use static map + label fade | SVG overlay / CSS | P1 |
| `anim/mars-dust` | M03 | Cinematic rising dust tint over **fictional illustration only**, *not* over modified authentic evidence image | CSS particles | P1 |
| `anim/signal-fade` | M03 | Stylized abstract radio waveform fades to silence; never label as actual NASA telemetry | CSS/SVG | P1 |
| `anim/legacy-constellation` | B01 | Moon and Mars nodes light up, simple connecting line; future nodes subdued | SVG motion | P0 |

**Sound design (optional P2):** 60-second royalty-cleared/commissioned atmospheric music loop; soft UI confirms; low ambient spacecraft hum; sound off by default and explicitly toggleable. Never use recognizable copyrighted soundtrack or pretend fictional sound is authentic NASA audio.

### 7.5 Asset manifest schema

Create `src/content/assets.ts` or `public/assets/manifest.json` with fields:

```ts
type AssetRecord = {
  id: string;
  localPath: string;
  kind: 'nasa-photo' | 'nasa-video' | 'fictional-ai-art' | 'original-diagram' | 'animation' | 'audio';
  title: string;
  alt: string;
  credit: string;
  sourceUrl?: string;
  usageReviewed: boolean;
  authenticityLabel: string; // "NASA archival image" | "Fictional illustration" | etc.
  status: 'approved' | 'pending' | 'placeholder';
};
```

**Requirement:** Every displayed media image is resolved through the manifest; pending images use labeled placeholders. Include attribution + external source link in a source drawer.

---

## 8. Suggested technology stack (commit to this for Phase 1)

| Layer | Choice | Why |
|---|---|---|
| App | **React + TypeScript + Vite** | Fast setup, static deploy, mature ecosystem |
| UI styling | **Tailwind CSS** | Responsive cinematic layouts; minimal overhead |
| Routing | **React Router** | Story/archive/source navigation |
| Animation | **Motion for React** (Framer Motion successor) or plain CSS where simpler | Controlled transitions, reduced motion support |
| Game mechanics | **React state + custom lightweight puzzle components** | No Phaser necessary for two evidence puzzles; reduces build risk |
| Atlas | **SVG + React**, 2D clickable map | Fast, accessible; 3D deferred |
| Story engine | **TypeScript/JSON scene schema + reducer** | Add future chapters without rewriting game code |
| State persistence | **localStorage** with versioned serialization | Offline-friendly, no account required |
| Tests | **Vitest + Testing Library + Playwright** | Story logic, factual UI, end-to-end flows |
| Icons | **Lucide React** | Small, readable icon library |
| Delivery | **Vercel / Netlify / GitHub Pages** (static SPA configured properly) | Shareable hackathon demo |
| Content | Bundled `src/content/*.ts` with vetted NASA citations | No LLM needed to generate live educational facts |

**Out of MVP scope:** Three.js, WebGL solar-system orbits, live NASA API integration, multiplayer, full voice acting, AI chatbot, resource management, user accounts, database, generative art API at runtime, and elaborate physics engines.

### Bootstrap commands (if starting an empty repository)

```bash
npm create vite@latest echoes-last-archive -- --template react-ts
cd echoes-last-archive
npm install
npm install react-router-dom lucide-react motion
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

Install and configure dependencies **consistent with the versions actually available at implementation time**. Do not blindly mix old Tailwind v3 configuration with Tailwind v4 packages. Run `npm run build` and tests before delivering.

### Proposed file tree

```text
echoes-last-archive/
├── README.md
├── package.json
├── public/
│   └── assets/
│       ├── art/             # approved fictional illustrations
│       ├── nasa/            # credited authentic images
│       └── manifest.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles.css
│   ├── app/
│   │   ├── routes.tsx
│   │   ├── GameContext.tsx
│   │   ├── gameReducer.ts
│   │   └── persistence.ts
│   ├── content/
│   │   ├── scenes.ts
│   │   ├── dialogue.ts
│   │   ├── missions.ts
│   │   ├── assets.ts
│   │   └── references.ts
│   ├── components/
│   │   ├── DialoguePanel.tsx
│   │   ├── CinematicStage.tsx
│   │   ├── CharacterPortrait.tsx
│   │   ├── ArtifactCard.tsx
│   │   ├── SourceDrawer.tsx
│   │   ├── SceneControls.tsx
│   │   ├── ApolloModuleDiagram.tsx
│   │   ├── MissionTimeline.tsx
│   │   └── SolarSystemAtlas.tsx
│   ├── puzzles/
│   │   ├── ApolloArtifactPuzzle.tsx
│   │   ├── OpportunityEvidencePuzzle.tsx
│   │   └── OpportunityCaptionPuzzle.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── StoryPage.tsx
│   │   ├── ArchivePage.tsx
│   │   ├── ArtifactDetailPage.tsx
│   │   └── SourcesPage.tsx
│   └── tests/
│       ├── storyFlow.test.ts
│       ├── puzzles.test.tsx
│       └── facts.test.ts
├── e2e/
│   └── fullJourney.spec.ts
└── docs/
    ├── SOURCES.md
    ├── ASSET_REGISTER.md
    └── SCIENCE_REVIEW.md
```

### Data schema / interaction engine

```ts
type SceneId = 'E00' | 'E01' | 'L01' | 'L02' | 'M01' | 'M02' | 'M03' | 'B01';

type Stage = 'earth' | 'moon' | 'mars' | 'beyond';

type DialogueLine = {
  speaker: 'Ari' | 'Maya' | 'Leo' | 'Sam' | 'ECHO' | 'Narrator';
  text: string;
};

type StoryScene = {
  id: SceneId;
  stage: Stage;
  title: string;
  backgroundAssetId: string;
  dialogue: DialogueLine[];
  puzzleId?: 'apollo-artifact-v1' | 'opportunity-evidence-v1' | 'opportunity-caption-v1';
  nextSceneId?: SceneId;
  estimatedSeconds: number;
  sourceIds?: string[];
};

type MissionRecord = {
  id: 'apollo-11-descent-stage' | 'opportunity';
  name: string;
  body: 'Moon' | 'Mars';
  historicalStatus: string;
  locationDescription: string;
  coordinates?: { latitude: number; longitude: number; precisionNote: string };
  launchOrLanding: string;
  endOfMission?: string;
  purpose: string;
  discoveriesOrLegacy: string[];
  leftBehindOrStoppedWhy: string;
  sourceIds: string[];
};

type SaveData = {
  schemaVersion: 1;
  currentSceneId: SceneId;
  currentDialogueIndex: number;
  completedPuzzles: string[];
  restoredArtifacts: string[];
  closingReflection?: string;
  settings: { audioEnabled: boolean; reduceMotion: boolean; captionsEnabled: boolean };
};
```

**Save rules:** Persist at every scene transition, puzzle completion, and settings change. If saved schema becomes invalid or unknown, safely reset to E00 with confirmation. Never block rendering if localStorage is unavailable.

---

## 9. Story-to-assets production matrix

| Scene | Story production | AI art | NASA images | Animation | Gameplay UI |
|---|---|---|---|---|---|
| E00 | Title + narrator line | Earth departure | None | Slow push/fade | Start / Explorer |
| E01 | 13 dialogue lines + 2 flavor options | Observation deck + portraits | None | ECHO pulse | Dialogue choices |
| L01 | 6 dialogue lines | Lunar flyby | Apollo 11 LRO site | Annotated reveal | Inspect button |
| L02 | 3 resolution lines, labels, factual text | None required | Apollo 11 orbital/surface photo | Stage schematic | Identify + reason puzzle |
| M01 | 7 dialogue lines | Mars arrival | Opportunity rover | Months-later route | Begin investigation |
| M02 | 4 closing lines + evidence explanations | None required | Rover / evidence rock / traverse | Route highlight | 3-card evidence puzzle |
| M03 | 10 dialogue lines + final-record explainer | Optional illustrated dust backdrop | Shadow + actual partial image | Signal fade | Caption choice |
| B01 | 10 ending beats | Mars window | None | Constellation | Reflection selection + menu |

### Reusable storytelling components

- `DialoguePanel`: speaker avatar/name, text, continue button, optional choices, auto-sized. Keyboard shortcut **Space** only if focus isn't in an interactive control.
- `CinematicStage`: full-bleed image/video, gradient for text legibility, labels for authenticity and year.
- `EvidencePanel`: source image with alt text, optional crop hotspot, citation action.
- `ArchiveCard`: title, location, status, source list, and difference between narrative summary and scientific claim.
- `SourceDrawer`: show numbered original NASA link, image credit, source description.
- `StoryProgress`: four stages with active stage and approximate percentage of completed *story beats* (not fake time countdown).

---

## 10. Implementation plan for Codex (work in this order)

### Sprint A — Foundation and playable skeleton (P0)

1. Scaffold React/TS/Vite, Tailwind, routes, game state, localStorage.
2. Implement scene engine consuming `src/content/scenes.ts` and exact scene IDs `E00`..`B01`.
3. Implement cinematic layout, dialogue panel, choices, stage progression, source drawer, and persistent settings.
4. Implement all dialogue from Section 4 and transitions using labeled media placeholders.
5. Add `Finish / Replay / Open Archive` outcome and ensure a full run is possible without missing assets.

**Exit criteria:** Beginning-to-end playthrough with complete script, no dead ends, refresh resumes. This is the first milestone—not a static splash page.

### Sprint B — Historical accuracy and playable puzzles (P0)

1. Add data-driven mission cards and verified NASA references.
2. Implement Apollo artifact puzzle using accessible click/tap controls.
3. Implement Opportunity evidence puzzle with selectable/reorderable cards.
4. Implement Opportunity caption challenge.
5. Add hint/explanation flow; validate completion persists and is replayable.

**Exit criteria:** Both historical missions can be “restored”; correct facts appear on cards; wrong answers lead to explanations, not failure.

### Sprint C — Media, cinematics, and map (P0/P1)

1. Load approved NASA images from registered local files; placeholders remain until files are vetted.
2. Add AI-created fictional art where supplied. Do **not** invoke an art generator at runtime.
3. Implement CSS/SVG animations: stage reveal, route transition, lunar diagram, constellation.
4. Build `/archive` stylized clickable Moon/Mars map and both detail pages.
5. Add source/credit drawer and media labels throughout.

**Exit criteria:** Story, archive, and source pages work; every visual is correctly labeled and credited; missing assets never result in broken-image icons.

### Sprint D — QA, polish, deployment (P0)

1. Test complete story with mouse, keyboard, mobile touch, and at 390px viewport width.
2. Check reduced motion, alternative input for every puzzle, and no auto-play audio.
3. Review factual statements against NASA sources; spellcheck all dialogue and mission terminology.
4. Run `npm run build`, Vitest, and Playwright; fix errors and warnings.
5. Ensure deployment uses SPA fallback (or compatible static routes) and make shareable URL.
6. Add concise README with setup, gameplay, fictional disclaimer, NASA credits, hackathon challenge context, and expansion plan.

**Exit criteria:** Public URL loads, full story finishes, archive independently accessible, attribution present, no broken paths, core tests pass.

### P1 and P2 feature priority (do not sacrifice P0)

- **P0:** complete script, two historical missions, three puzzles, two archive cards, sources, responsive UI, static media fallbacks, local persistence, intro/outro, deployable build.
- **P1:** polished generated artwork, student portraits, animated route reveal, custom diagram motion, atmospheric sound, improved atlas interactions.
- **P2:** voice acting, multilingual subtitles, shader effects, interactive 3D globe, live NASA API search, advanced telemetry visualizations.

---

## 11. Acceptance criteria (must all pass before calling MVP done)

### Functional

- [ ] Story can be completed from E00 through B01 without refreshing.
- [ ] Expected story is approximately 10 minutes at typical reading/puzzle speed; no fixed timers.
- [ ] Each scene has visible stage name, context, and clear next interaction.
- [ ] Dialogue can be navigated manually; narrative choices do not lead to dead ends.
- [ ] Apollo puzzle's correct answer is **descent stage**; explanation differentiates ascent/departure.
- [ ] Opportunity puzzle teaches **evidence of past water**, not “discovered life.”
- [ ] Opportunity final scene accurately shows June 10, 2018 last contact and Feb. 13, 2019 mission end.
- [ ] Closing reflection leads to a complete ending and openable archive.
- [ ] Archive map works without story completion; progress badges restore after replay.
- [ ] Browser reload safely retains progress, settings, and completed missions.

### Scientific and ethical

- [ ] Fictional 2047 spacecraft is clearly marked fictional.
- [ ] All NASA mission claims have functioning original sources.
- [ ] Every historical image has a real credit; every fictional image clearly says illustration.
- [ ] No Apollo 11 lunar rover is shown or claimed.
- [ ] No invented Opportunity final spoken message is treated as historical fact.
- [ ] No fictional “actual 2047 NASA mission status” claims.
- [ ] Current-status wording is explicitly tied to known historical evidence.
- [ ] No NASA logo is used to imply endorsement.

### Engineering and accessibility

- [ ] `npm run build` succeeds.
- [ ] Core tests succeed.
- [ ] 390px mobile viewport is usable without horizontal scrolling.
- [ ] All essential interactions can be completed by keyboard and tap.
- [ ] Reduced-motion UI replaces or substantially reduces animated sequences.
- [ ] Image loading failures show clean placeholders and credit/source text.
- [ ] All user-visible text content can be read without enabling audio.
- [ ] Sources page and external NASA links work.

### Suggested automated tests

- Scene transitions: E00→E01→L01→L02→M01→M02→M03→B01.
- Apollo incorrect guesses do not falsely mark completion.
- Opportunity interpretation rejects proof-of-life answer.
- All `sourceIds` in mission content resolve to valid source URLs.
- Every asset referenced by a scene resolves in manifest (approved or placeholder).
- Archive pages exist for both mission IDs and cannot crash if asset absent.
- SaveData version migration/reset behavior is safe.
- End-to-end test completes story with keyboard-only interactions.

---

## 12. Scope decisions / future 45-minute expansion

The current Phase 1 delivers a **complete short arc**, not a truncated Act I.

| Stage | Phase 1 | Later full adventure |
|---|---|---|
| Earth | Odyssey prologue | Skylab historical investigation |
| Moon | Apollo 11 hardware | Apollo 15 lunar rover route |
| Mars | Opportunity main story | Viking 1 evidence lab; Ingenuity flight investigation |
| Beyond | Epilogue + locked teaser | Cassini planetary-protection mystery and complete Legacy Constellation |

**Future content rule:** Add each new historical subject using `MissionRecord`, source manifest, scene data, image credits, and investigation puzzle. Avoid adding a mechanics-only minigame unless it teaches something specific about an abandoned/retired artifact.

**Potential later optional Hubble-inspired puzzle:** A historical image-restoration interaction modeled on Hubble servicing can be interesting, but Hubble is **not a retired artifact in the 2026 evidence base**; it should remain a side reference, not a main abandoned-hardware mission.

---

## 13. References and research links

The links below are implementation verification targets and should appear in the app's Sources page. Historical facts are anchored to NASA; the two challenge descriptions define scope. **Review final asset-specific rights/credits before bundling media.**

### Challenge

- **[CH1] NASA Space Apps 2026 — Abandoned but Not Forgotten:** https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/  
  Challenge summary: historical hardware on Moon, Mars, and deep space; storytelling and education for school-age space enthusiasts.
- **[CH2] NASA Space Apps 2026 — Junior Astronaut Mission Trainer:** https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/  
  Separate challenge focused on running an outpost and engineering tradeoffs.

### Apollo 11

- **[N1] NASA Apollo 11 Lunar Surface Journal / Mission Overview:** https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11ov.html  
  Mission July 16–24, 1969, lunar landing July 20, 1969, Sea of Tranquility, landing-site coordinates, ascent stage left lunar surface.
- **[N2] NASA Apollo 11 Landing Site (LRO image):** https://science.nasa.gov/resource/apollo-11-landing-site/  
  LRO image showing left-behind descent stage and astronaut tracks. Credited NASA/GSFC/Arizona State University.
- **[N3] NASA Apollo 11 mission log:** https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/apollo11_log/log.htm  
  Documents departure from descent stage and equipment left behind.

### Opportunity

- **[N4] NASA Opportunity mission page:** https://science.nasa.gov/mission/mer-opportunity/  
  90-sol expected mission, landed January 24, 2004, last contact June 10, 2018, ended February 13, 2019, distance 45.16 km.
- **[N5] NASA Opportunity mission end article:** https://science.nasa.gov/missions/mer/nasas-opportunity-rover-mission-on-mars-comes-to-end/  
  Storm, ending, science legacy.
- **[N6] NASA Opportunity’s Last Message (image and context):** https://science.nasa.gov/resource/opportunitys-last-message/  
  Last incomplete full-frame downlink June 10, 2018; nuanced distinction from subsequent thumbnail images.
- **[N7] NASA Opportunity's Final Traverse Map:** https://science.nasa.gov/photojournal/opportunitys-final-traverse-map/  
  Official final route and Perseverance Valley location context.
- **[N8] NASA Mars Exploration Rovers (Spirit and Opportunity):** https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/  
  Science history and media starting point.

### Asset-use guidance

- **[MEDIA] NASA Images and Media Guidelines:** https://www.nasa.gov/nasa-brand-center/images-and-media/  
  NASA material can generally be used for educational/informational purposes with credit, subject to restrictions, third-party rights, and non-endorsement. Don't treat NASA insignia/identifiers as free branding assets.

---

## 14. Exact handoff prompt for Codex

Copy the following into Codex **with this Markdown file available in the repository**:

```text
Implement Phase 1 of ECHOES: The Last Archive by following ECHOES_PHASE_1_CODEX_IMPLEMENTATION.md as the source of truth.

Build a functioning React + TypeScript + Vite web game, not a mockup. Prioritize a complete 10-minute beginning-to-end story across Earth, Moon, Mars and Beyond, with the exact eight scene IDs, authentic historical mission content for Apollo 11 and Opportunity, three accessible scientific evidence puzzles, an independently accessible 2D Archive map, source citations/media credits, and local progress persistence.

Create all required source files and tests. Use cohesive visual placeholders where actual AI art or approved NASA photos are not yet supplied; keep authenticity labels and NASA source links visible. Do not invent historical facts or mark generated images as NASA photographs. Do not add orbital collision games, oxygen/power management, or mission-control survival loops.

Implement in the order specified under Sprint A through D. Verify npm install, npm run build, unit tests, and at least one complete end-to-end playthrough. Report the files changed, features completed, tests run, any remaining asset sourcing tasks, and any deviations from this specification. If blocked by missing assets, deliver the working story with graceful placeholders rather than stopping.
```

---

## 15. Definition of done / product demo

A judge lands on the homepage, presses **Begin Journey**, experiences the fictional 2047 expedition, inspects a **real Apollo 11 artifact**, reconstructs **Opportunity's true science and final mission events**, reads an emotionally resonant ending, and explores both artifacts in a **clickable NASA-sourced archive**—all in a ~10-minute self-contained story. The judge can see exactly which images are genuine NASA records, which illustrations are fictional, and how the project fulfills the discarded-equipment storytelling challenge.

**Closing statement:** *“Some missions end. Their discoveries do not.”*
