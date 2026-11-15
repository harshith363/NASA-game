# Lunar Outpost prototype validation

> **Historical reference.** Historical validation for the short storm drill. The scenarios and results below apply to that build. See the [current game overview](GAME_OVERVIEW.md) and [campaign validation](CAMPAIGN_VALIDATION.md).

**Phase 1 implementation: complete.** Automated rule checks, production build, and browser verification passed. The usability and physical-device checks below remain pending.

Run `npm test` for the deterministic rules and `npm run build` for type checking and the production bundle. The rule tests cover projections, both failure types, unaffordable drafts, both success strategies, the alternate scenario, and every combination of two plans for crew safety.

The first scenario starts with 11 battery, 3 reserve air, and a 3-point harvest target. Peak adds 1 power for either air mode and 1 extra air if a player chooses reserve. Using reserve during the peak drains even a full tank. The alternate scenario starts with 10 battery and keeps the same rules.

| Sheltered strategy (Rising → Peak) | Battery / Air / Harvest | Debrief |
| --- | --- | --- |
| Normal + dim → normal + dim | 2 / 3 / 2 | Crew protected; harvest delayed |
| Normal + off → normal + off | 4 / 3 / 0 | Crew protected; harvest delayed |
| Normal + full → normal + dim | 0 / 3 / 3 | Crew protected; harvest secured |
| Reserve + full → normal + dim | 1 / 1 / 3 | Crew protected; harvest secured |
| Alternate: reserve + full → normal + dim | 0 / 1 / 3 | Crew protected; harvest secured |

Desktop Chrome verification used a 1280 × 800 viewport with WebGL and a real launch gesture. It covered the arrival, forecast while viewing a different facility, unchanged resources during planning and shift resolution, duplicate commit, skipping, recovery, replay, retry with an outstanding forecast, and synchronized audio and suspend/resume behavior. A 360 × 640 mobile-emulated viewport covered keyboard navigation, reduced motion, static map, and fully muted play. The browser checks also simulated denied audio playback and missing score/cue assets.

The five facilitated first-time sessions from the plan remain a usability follow-up. In those sessions, check how long it takes children to make their first meaningful choice, whether they notice the shift result, and which tradeoff they can explain afterward. Test on physical mobile devices and listen on headphones and built-in speakers before drawing conclusions about readability or the sound mix.
