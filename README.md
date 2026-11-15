# Junior Astronaut Mission Trainer

Fly from Earth to the Moon, build and staff a lunar outpost, explore by rover, and bring five astronauts home. Pass the departure checks, board on Days 13–15 or during a later departure window, and guide the return capsule to ocean splashdown. The debrief scores the run out of 100.

## Installation and setup

You’ll need Git, Node.js 22.12 or newer with npm, and a modern browser. The outpost uses a static map when WebGL 2 is unavailable. If you already have the repository, open a terminal in its root and start with `npm ci`.

```sh
git clone https://github.com/harshith363/NASA-game.git
cd NASA-game
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173`. Press `Ctrl+C` in the terminal to stop the server.

Start or resume the outbound flight, or choose **Go directly to outpost** to skip the flight. The outpost starts paused. Build and assign crew before pressing **Play**. After touchdown, select **Enter lunar outpost** to start Day 1 for that flight. Each landed flight has its own saved outpost in browser storage. The direct outpost bypass uses a separate save.

### Test and build

- `npm test` runs simulation, save, and data-parsing checks.
- `npm run build` type-checks and writes the production bundle to `dist/`.
- `npm run preview` serves the production bundle locally after a build.

Netlify publishes `dist/` and serves the telemetry function in `netlify/functions/`. Vite serves the same telemetry endpoint in development and preview. Local setup works without an API key. The game’s simulated readings remain available when the server cannot reach the external telemetry feeds.

## Documentation

| Start here | What it covers |
| --- | --- |
| [Game overview](docs/GAME_OVERVIEW.md) | Current chapters, controls, science, save behavior, and project structure. |
| [Timed lunar outpost](docs/TIMED_OUTPOST.md) | Construction, crew jobs, storms, rover radar, departure, and scoring. |
| [Control Tower telemetry](docs/TELEMETRY.md) | All 15 readings, providers, units, and fallback behavior. |
| [Campaign enhancements](docs/GAME_ENHANCEMENT_PLAN.md) | Implementation status for the seven enhancements and their acceptance checks. |
| [Campaign phases](docs/LUNAR_CAMPAIGN_PHASED_PLAN.md) | How the project progressed from staffed facilities to Earth return and exploration. |
| [Campaign validation](docs/CAMPAIGN_VALIDATION.md) | Current automated results, browser smoke checks, and release checks. |
| [Asset and data register](docs/ASSET_REGISTER.md) | Credits, sources, and which assets the current game uses. |

The older [prototype plan](JUNIOR_ASTRONAUT_IMPLEMENTATION_PLAN.md), [prototype feedback](PROTOTYPE_IMPROVEMENT_PLAN.md), [seven-day survival plan](SURVIVAL_GAME_PHASED_PLAN.md), [Lunar experience plan](LUNAR_GAME_EXPERIENCE_IMPROVEMENT_PLAN.md), and [outbound flight plan](docs/EARTH_TO_MOON_IMPLEMENTATION_PLAN.md) document earlier milestones. Their validation records are linked from the [current campaign validation](docs/CAMPAIGN_VALIDATION.md).
