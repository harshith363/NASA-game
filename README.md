# Junior Astronaut Mission Trainer

Land at a lunar outpost and keep five astronauts safe for seven days. Read the daily forecast, plan power and life support, and preview tomorrow’s supplies before choosing **End Day**. Shelter during the particle alert and grow a crop in time to supplement the crew’s stored food. Finish with at least four battery and two food to complete the readiness objective.

The Farm controls grow lights and introduces water recovery on day two. The Control Tower shows generation and demand separately, along with air and shelter choices. The Communications Centre can provide a forecast and includes the archived NASA observation that inspired the alert. Resource units, daily sunlight, and crop timing are training parameters.

The browser saves each committed turn. **Resume mission** restores the current briefing, unread report, or debrief. **Start new mission** replaces the existing run. The debrief offers standard and low-battery training. Settings include audio and reduced motion. The game supports keyboard controls and a static map when WebGL is unavailable.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Run `npm test` for rule and save checks, `npm run build` for type checking and the production bundle, and `npm run preview` to serve that bundle locally.

## Project layout

- `src/mission/` holds daily rules, save validation, and the event contract for visuals and audio.
- `src/ui/` holds the HUD, facility controls, forecasts, radio, reports, and preferences.
- `src/scenes/` holds the Three.js outpost, arrival, turn animations, and static map.
- `src/audio/` and `public/audio/` hold the adaptive score and cues. See the [asset register](docs/ASSET_REGISTER.md).
- `src/data/` holds facility metadata and the bundled NASA DONKI record.

See the [survival plan](SURVIVAL_GAME_PHASED_PLAN.md) for the implementation handoff and [Lunar milestone verification](docs/LUNAR_SURVIVAL_VALIDATION.md) for rules, scenarios, and checks.
