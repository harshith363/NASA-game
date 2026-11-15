# Control Tower telemetry

From the timed outpost, open **Communications Centre → Request telemetry** or **Mission Control Tower → Request telemetry**. The report opens on demand and **Request updated report** refreshes it. It contains five mission readings plus up to ten readings from NASA and NOAA.

Each fictional outpost reading carries a **Simulated** badge and follows the mission clock. External readings use their source timestamps in UTC, independently of playback speed. GOES proton flux describes near-Earth conditions. External feeds provide context and do not change the mission’s storm or resource rules.

## Simulated mission readings

| Reading | Game source |
| --- | --- |
| Sun elevation | Simulated angle above the outpost’s horizon, in degrees. The terrain lighting uses this angle. |
| Local radiation | Background, elevated, or high outside shelter, with the number of sheltered crew. |
| Solar generation | Gross power per day from the base and its online solar assets. Includes the storm reduction. |
| Rover charge and estimated return charge | Current vehicle battery and estimated charge for a direct route to the dock across the terrain. |
| Radar contacts | Number of discovered and collected supply sites. |

## External readings

| Group | Reading | Unit | Source |
| --- | --- | --- | --- |
| Calculated astronomy | Earth–Moon distance | km | [NASA JPL Horizons](https://ssd-api.jpl.nasa.gov/doc/horizons.html) |
| Calculated astronomy | Lunar disk illuminated as seen from Earth | % | [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html) |
| Calculated astronomy | One-way Earth–Moon light time | s | [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html) |
| Solar and space | Solar wind speed | km/s | [NOAA SWPC Solar Wind](https://www.spaceweather.gov/products/solar-wind) |
| Solar and space | Solar wind proton density | particles/cm³ | [NOAA SWPC Solar Wind](https://www.spaceweather.gov/products/solar-wind) |
| Solar and space | Solar X-ray flux at 0.1–0.8 nm | W/m² | [NOAA GOES X-ray Flux](https://www.spaceweather.gov/products/goes-x-ray-flux) |
| Solar and space | Near-Earth proton flux at energies ≥10 MeV | pfu | [NOAA GOES Proton Flux](https://www.spaceweather.gov/products/goes-proton-flux) |
| Solar and space | Latest cataloged solar particle event in the query window | Event ID and time | [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) |
| Earth | Planetary geomagnetic activity | Kp | [NOAA Planetary K-index](https://www.spaceweather.gov/products/planetary-k-index) |
| Earth | Surface wind speed in Melbourne, Florida | km/h | [NOAA NWS Melbourne](https://www.weather.gov/mlb/), station KMLB |

Horizons provides a calculated observer table. The server converts range from astronomical units to kilometers and light time from minutes to seconds. DONKI is an event catalog. An empty 30-day window means the catalog returned no entries for that period.

## Integration and availability

The browser calls `GET /.netlify/functions/telemetry`. In development and preview, [Vite middleware](../vite.config.ts) supplies the route. On Netlify, the [telemetry function](../netlify/functions/telemetry.ts) supplies it. Both use the same [server-side fetch and normalization logic](../src/server/telemetrySources.ts), with fixed public endpoints and per-source timeouts. This project does not require a NASA API key for these feeds.

Readings are requested in parallel and parsed independently. The server reuses recent batches and can return its last successful value for a feed that fails, marked **cached** with the original timestamp. An unavailable feed has no substituted numeric value. The five simulated mission readings still display if the server or all external feeds are unavailable. A plain static host needs to provide the telemetry endpoint to show live readings.

See the [asset and data register](ASSET_REGISTER.md) for bundled historical evidence and [campaign validation](CAMPAIGN_VALIDATION.md) for checks.
