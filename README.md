# Junior Astronaut Mission Trainer

A browser game for the NASA Space Apps Challenge. Land at a lunar outpost, shelter the crew through two storm shifts, and prepare three harvest points for tomorrow’s fresh-food supplement. The Control Tower shows current simulated telemetry; Communications can retrieve a forecast from Mission Control; the farm shows what each grow light setting adds. The crew and greenhouse share a battery. The peak costs more, and using reserve air at the peak can empty the tank.

Shift choices are previews until committed. The game supports keyboard controls, reduced motion, a static fallback for WebGL, and captioned play with or without sound. Retry the first storm or choose the low battery challenge in the debrief. Resource values and consequences are simplified for the drill.

**Phase 1 status:** complete. The playable prototype includes the later arrival, forecast, audio, and replay improvements. Facilitated player sessions and physical-device checks remain pending. See the [validation record](docs/PROTOTYPE_VALIDATION.md).

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Run `npm test` to check the mission rules, `npm run build` to type-check and build the static site into `dist/`, and `npm run preview` to serve that build locally.

## Project layout

- `src/scenes/`: Three.js lunar base, arrival, shift and harvest sequences, and static map.
- `src/mission/`: scenario rules, draft projections, outcomes, and committed presentation events.
- `src/ui/`: accessible facility controls, radio, shift reports, and debrief.
- `src/audio/` and `public/audio/`: adaptive score, sound cues, and saved preferences. See the [asset register](docs/ASSET_REGISTER.md).
- `src/data/`: facility metadata and the bundled NASA DONKI event record.

See the [prototype improvement plan](PROTOTYPE_IMPROVEMENT_PLAN.md) for the design and first-time player usability targets.
