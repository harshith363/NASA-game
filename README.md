# ECHOES · The Last Archive

A roughly ten-minute, self-paced browser adventure. In a fictional 2047, four students aboard Odyssey restore an archive using actual evidence from Apollo 11 and Opportunity. The eight scenes and their pacing follow [the Phase 1 blueprint](ECHOES_PHASE_1_CODEX_IMPLEMENTATION.md).

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open [the local game](http://127.0.0.1:5173/) and select **Begin Journey**. Continue at your own pace. Use **Back**, **Replay scene**, and **Skip animation** as needed. Tab and Enter work throughout, and Space advances dialogue when focus is outside interactive controls. The **Archive** is available from the start. It contains both historical records, credits, sources, and puzzle replays.

Sound defaults to off. All dialogue is readable, and reduced motion follows the browser preference or the explicit game setting. Progress, restoration badges, and settings are stored in this browser. An unfinished puzzle restarts at its first prompt on reload.

## Build and test

```sh
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

The build creates `dist/` with the React Router entry point at each known route. Use `npm run preview` to serve the built version locally. The repository includes a Netlify SPA fallback. A private Sites project was reserved, but automatic approval review blocked the source upload without explicit authorization for the external transfer. The project is unpublished. A static host should serve each route's `index.html` or rewrite application routes to the root `index.html`.

## Historical record and credits

Odyssey, its students, and their expedition are fictional. The game is independently produced for the [NASA Space Apps discarded-equipment storytelling challenge](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources). All historical media are bundled from NASA and credited in the Sources screen. The [media register](docs/ASSET_REGISTER.md) records the original files and ImageGen prompts. The [science review](docs/SCIENCE_REVIEW.md) explains dating, interpretation, and source choices.

Phase 1 ends aboard Odyssey at Mars. Later chapters can add new archive records and investigations for Viking, Ingenuity, Cassini, and additional hardware.
