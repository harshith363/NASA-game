# Asset register

The game registers media in [assets.ts](../src/content/assets.ts). NASA source pages, individual credits, and NASA's [media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) were reviewed for this educational use. The NASA JPEGs are local copies of official web renditions. Each original record remains accessible in the game.

| Local file under `public/assets/nasa/` | Original NASA record | Credit |
| --- | --- | --- |
| apollo11-landing-site.jpg | [Apollo 11 landing site](https://science.nasa.gov/resource/apollo-11-landing-site/) | NASA/GSFC/Arizona State University |
| apollo11-hardware-context.jpg | [The Eagle Prepares to Land](https://science.nasa.gov/resource/the-eagle-prepares-to-land/) | NASA |
| opportunity-rover.jpg | [Opportunity’s first selfie](https://science.nasa.gov/photojournal/opportunitys-first-selfie/) | NASA/JPL-Caltech |
| opportunity-eagle-crater.jpg | [Lion King panorama](https://science.nasa.gov/photojournal/opportunity-captures-lion-king-panorama/) | NASA/JPL/Cornell |
| opportunity-evidence-rock.jpg | [Evidence of a Water-Soaked Past](https://science.nasa.gov/photojournal/evidence-of-a-water-soaked-past/) | NASA/JPL |
| opportunity-traverse.jpg | [Opportunity’s final traverse map](https://science.nasa.gov/photojournal/opportunitys-final-traverse-map/) | NASA/JPL-Caltech/MSSS |
| opportunity-shadow.jpg | [Opportunity catches its shadow](https://science.nasa.gov/resource/opportunity-catches-its-shadow/) | NASA/JPL-Caltech |
| opportunity-last-image.jpg | [Opportunity’s Last Message](https://science.nasa.gov/resource/opportunitys-last-message/) | NASA/JPL-Caltech/Cornell/ASU |

## Fictional artwork and prompts

The five cinematic backgrounds and the student cast sheet were made with built-in OpenAI ImageGen. The backgrounds were encoded at 1600 × 900 as WebP. The cast sheet was cropped into four 256 × 256 WebP portraits. ECHO's ring is original SVG artwork.

The five backgrounds used this shared prompt followed by the listed scene prompt.

> Use case: stylized-concept. Asset type: 16:9 landscape cinematic background for ECHOES, a premium science documentary game for ages 10–14. Photorealistic aerospace concept art, grounded 2047 design, film grain, deep midnight navy shadows, subtle amber lighting, atmospheric depth, no text, logos, or graphic overlays. Odyssey exterior design: long white ceramic central spine, paired slim blue solar wings and a swept triangular glass observation bow, small teal-white aft engine glow. Interior design: dark midnight navy curved structural ribs, wide wraparound glass and restrained warm light. If students are visible, show four distinct young teenagers in silhouette only.

| Local file under `public/assets/art/` | Scene prompt |
| --- | --- |
| odyssey-earth-departure.webp | Establishing exterior in Earth orbit, large dramatic curved cyan-lit Earth stretching from lower center toward far right, spacecraft crossing above it on the right, star field and dark negative space on the left for title UI, hopeful and visually arresting. |
| odyssey-observation-deck.webp | Wide interior of the panoramic observation deck, blue Earth through expansive windows, four small teenage silhouettes on right watching Earth, dark negative space on left and bottom for dialogue UI. |
| odyssey-lunar-flyby.webp | Wide exterior lunar flyby, silvery cratered lunar limb sweeps down on right, spacecraft on right lit by rim light, dark open starfield on left and lower part for legible UI. |
| odyssey-mars-arrival.webp | Wide exterior on approach to Mars, immense rusty orange globe on right with dramatic thin atmosphere, Odyssey silhouetted against the bright limb, dark open space left and at bottom. |
| odyssey-mars-window.webp | Quiet emotional interior closing frame, four small teenage silhouettes looking out at Mars from the observation lounge, copper glow through panoramic windows, composition weighted right, deep dark negative space at left and bottom. |
| student-ari.webp, student-maya.webp, student-leo.webp, student-sam.webp | Four-cell cast sheet described below. |
| echo-avatar.svg | Hand-authored ECHO ring and waveform. |

> Use case: stylized-concept. Asset type: four-character portrait sprite sheet for the cinematic documentary game ECHOES. A precise 2×2 grid of four fully separate equal square cells, each containing one centered upper torso and face with comfortable margins. Top left Ari, 13, curious South Asian student, short black hair and muted blue collar. Top right Maya, 14, science-minded Black student with tightly curled hair tied back, forest green collar. Bottom left Leo, 13, playful light-skinned student with tousled brown hair and rust-orange collar. Bottom right Sam, 14, thoughtful East Asian student with straight black hair and muted violet collar. Young teenagers, authentic natural human features, gender expression can vary. All have simple fictional spacecraft passenger utility clothes with no insignia. Restrained photorealistic illustrative painted look, each portrait readable at small avatar size, understated warm edge lighting, uniform dark navy #101b29 background across all cells. No text, no labels, no dividers, no logos. Square image.
