# Prototype audio asset register

All files below are original for Lunar Outpost. Creator: OpenAI Codex for this prototype. Source: [score and cue generator](../scripts/generate-mission-audio.py). These generated recordings contain no third-party samples. License: CC0 1.0 Universal; attribution is optional. Regenerate with `python3 scripts/generate-mission-audio.py`.

| Files in `public/audio/` | Use |
| --- | --- |
| `foundation.wav`, `pulse.wav`, `peak.wav` | One 48-second composition rendered as three synchronized stems. |
| `arrival.wav`, `harvest.wav` | Arrival theme and fresh-food delivery phrase. |
| `interface.wav`, `warning.wav`, `forecast.wav`, `shelter.wav`, `allocation.wav` | Commit, tower warning, radio reply, shelter confirmation, and power distribution cues. |
| `delayed.wav`, `interrupted.wav` | Calm variations for a smaller harvest or an interrupted drill. |


## Crew and particle-alert illustrations

OpenAI Codex drew these assets for the Lunar crew milestone. The graphics use original programmatic drawing with Pillow and are licensed CC0 1.0 Universal. The cutaway and particle trace depict a fictional training scenario.

| Files in `public/media/` | Use |
| --- | --- |
| `crew-aya.webp`, `crew-mateo.webp`, `crew-imani.webp`, `crew-leena.webp`, `crew-noah.webp` | 136 × 136 helmet portraits with the same accent colors as the five outpost models. |
| `particle-alert.gif` | 640 × 264 cutaway and instrument illustration. The 38 frames loop over about 4.2 seconds. File size is about 102 KiB. |
| `particle-alert-poster.webp` | Still frame showing the high reading and the crew inside the shelter. Used in reduced motion, when paused, and if the GIF fails. |

The historical particle observation is available through the [NASA DONKI archive](https://ccmc.gsfc.nasa.gov/DONKI/events/30717/1/). NASA describes the use of shielding for exposure protection in [How NASA Will Protect Astronauts From Space Radiation at the Moon](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/).
