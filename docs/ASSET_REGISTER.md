# Asset and data register

The prerecorded audio files in this section are original for Lunar Outpost. Creator: OpenAI Codex for this prototype. Source: [score and cue generator](../scripts/generate-mission-audio.py). These generated recordings contain no third-party samples. License: CC0 1.0 Universal; attribution is optional. Regenerate with `python3 scripts/generate-mission-audio.py`.

| Files in `public/audio/` | Use |
| --- | --- |
| `foundation.wav`, `pulse.wav`, `peak.wav` | One 48-second composition rendered as three synchronized stems. |
| `arrival.wav`, `harvest.wav` | Arrival theme and fresh-food delivery phrase. |
| `interface.wav`, `warning.wav`, `forecast.wav`, `shelter.wav`, `allocation.wav` | Commit, tower warning, radio reply, shelter confirmation, and power distribution cues. |
| `delayed.wav`, `interrupted.wav` | Calm variations for a smaller harvest or an interrupted drill. |


## Crew portraits and historical particle-alert illustrations

OpenAI Codex drew these assets for the Lunar crew milestone. The graphics use original programmatic drawing with Pillow and are licensed CC0 1.0 Universal. The cutaway and particle trace depict a fictional training scenario.

| Files in `public/media/` | Use |
| --- | --- |
| `crew-aya.webp`, `crew-mateo.webp`, `crew-imani.webp`, `crew-leena.webp`, `crew-noah.webp` | 136 × 136 helmet portraits with the same accent colors as the five outpost models. |
| `particle-alert.gif` | 640 × 264 cutaway and instrument illustration. The 38 frames loop over about 4.2 seconds. File size is about 102 KiB. |
| `particle-alert-poster.webp` | Still frame showing the high reading and the crew inside the shelter. Used by the timed and legacy storm briefings for reduced motion, pause, and image fallback. |

The historical particle observation is available through the [NASA DONKI archive](https://ccmc.gsfc.nasa.gov/DONKI/events/30717/1/). NASA describes the use of shielding for exposure protection in [How NASA Will Protect Astronauts From Space Radiation at the Moon](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/).

## Flight visuals and audio

The launchpad, rocket, transit craft, lander, Earth/Moon forms, return capsule, parachutes, and route diagrams use original procedural assets in `src/scenes/FlightScene.ts` and `src/ui/flightRoute.ts`. No external textures are used. The return chapter shares the outbound camera and trajectory presentation. Flight materials and geometries are scene-owned; the outpost’s shared astronaut materials are not disposed by the flight chapter.

Flight power, boot, fan, clearance, ignition, staging, burn, warning, confirmation and touchdown cues are original Web Audio oscillator envelopes in `src/audio/missionAudio.ts`, generated at runtime without third-party samples. They use the shared effects volume and mute preference. Crew portraits reuse the existing assets above.

NASA evidence (retrieved 14 November 2026):

| Bundled file | Credit and source | Processing / limits |
| --- | --- | --- |
| `src/data/flight-cabin.json` | NASA OSDR Environmental Data App, [RR-1 dashboard](https://visualization.osdr.nasa.gov/eda/dashboard_RR-1) | Twelve hourly samples from the source five-minute ISS cabin CO₂ series, 26 September 2014 00:00–11:00 GMT; ppm. No averaging or unit conversion. |
| `src/data/flight-artemis.json` | NASA/JSC/FOD/FDO, [Artemis II ephemeris](https://www.nasa.gov/wp-content/uploads/2026/03/all-artemis-ii-oem-files.zip); contextual visualization credit NASA SVS, Kel Elkins and Ernie Wright, [SVS 5632](https://svs.gsfc.nasa.gov/5632) | 97 sampled rows from the 10 April solution; UTC, Earth-centered EME2000, positions in km. XY projection. Points after solution creation are predictions; this is not live telemetry or the training route. No SVS video or image is redistributed. |

Source metadata and input digests are in the JSON files. Reproduction script: `scripts/prepare-flight-data.py`. The NASA measurements are attributed source data, not original CC0 artwork. No NASA logo or endorsement is implied. Full verification limits are recorded in `docs/EARTH_TO_MOON_VALIDATION.md`.

## Timed surface assets

- [Outpost scene](../src/scenes/OutpostScene.ts) and [facility models](../src/scenes/campaignModels.ts) create the terrain props, construction states, rover chassis, wheels, suspension, cache beacons, and a stylized Surveyor-inspired model. [Lunar terrain](../src/scenes/lunarTerrain.ts) generates its own dust texture. The game uses an invented topography and supply locations.
- [Game styles](../src/styles.css) define the timed campaign’s amber overlay and moving particle streaks. The timed storm briefing uses the illustration GIF and poster beside the archived observation. In the timed campaign reduced motion uses a static overlay.
- The [Apollo 12 and Surveyor 3 exhibit](../src/ui/campaignControls.ts) uses original HTML and procedural scene elements. Its mission-history reference is [NASA’s Apollo 12 overview](https://www.nasa.gov/missions/apollo/apollo-12-the-pinpoint-mission/).

## On-demand telemetry

NASA and NOAA values in the Control Tower are fetched at runtime, with source and timestamp labels. They are separate from the bundled archival samples and fictional mission variables. See the [telemetry reference](TELEMETRY.md) for providers, units, normalization, and fallback behavior.

## Apollo geology exhibit photographs

| Bundled file | Credit and archive | Use |
| --- | --- | --- |
| `public/media/apollo15-genesis.webp` | NASA, AS15-86-11671. [Apollo 15 at Hadley–Apennine](https://www.nasa.gov/history/50-years-ago-apollo-15-on-the-moon-at-hadley-apennine/) | Genesis Rock on the surface before collection at Spur Crater. |
| `public/media/apollo16-north-ray.webp` | NASA, AS16-116-18607. [Apollo 16 at Descartes](https://www.nasa.gov/history/apollo-16-on-the-moon-at-descartes/) | Charles Duke and the rover at North Ray Crater. |
| `public/media/apollo17-shorty.webp` | Eugene Cernan, Apollo 17 Crew / NASA. [NASA Science APOD archive](https://science.nasa.gov/image-article/apod-2015-august-2-apollo-17-at-shorty-crater/) | Harrison Schmitt and the rover beside Shorty Crater. |

The credited NASA photographs appear inside educational exhibits and were resized and encoded as WebP for offline play. [NASA images and media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)
