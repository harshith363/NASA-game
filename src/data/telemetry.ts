export const feeds = {
  distance: { label:'Earth–Moon distance', unit:'km', group:'Astronomy', source:'NASA JPL Horizons', url:'https://ssd-api.jpl.nasa.gov/doc/horizons.html' },
  illumination: { label:'Moon illuminated from Earth', unit:'%', group:'Astronomy', source:'NASA JPL Horizons', url:'https://ssd-api.jpl.nasa.gov/doc/horizons.html' },
  lightTime: { label:'One-way Earth–Moon light time', unit:'s', group:'Astronomy', source:'NASA JPL Horizons', url:'https://ssd-api.jpl.nasa.gov/doc/horizons.html' },
  solarSpeed: { label:'Solar wind speed', unit:'km/s', group:'Solar and space', source:'NOAA SWPC', url:'https://www.spaceweather.gov/products/solar-wind' },
  solarDensity: { label:'Solar wind proton density', unit:'particles/cm³', group:'Solar and space', source:'NOAA SWPC', url:'https://www.spaceweather.gov/products/solar-wind' },
  xray: { label:'Solar X-ray flux · 0.1–0.8 nm', unit:'W/m²', group:'Solar and space', source:'NOAA GOES', url:'https://www.spaceweather.gov/products/goes-x-ray-flux' },
  protons: { label:'Near-Earth proton flux · ≥10 MeV', unit:'pfu', group:'Solar and space', source:'NOAA GOES', url:'https://www.spaceweather.gov/products/goes-proton-flux' },
  particle: { label:'Latest cataloged solar particle event', unit:'', group:'Solar and space', source:'NASA DONKI', url:'https://ccmc.gsfc.nasa.gov/tools/DONKI/' },
  kp: { label:'Earth geomagnetic activity', unit:'Kp', group:'Earth', source:'NOAA SWPC', url:'https://www.spaceweather.gov/products/planetary-k-index' },
  earthWind: { label:'Melbourne, Florida surface wind', unit:'km/h', group:'Earth', source:'NOAA NWS · KMLB', url:'https://www.weather.gov/mlb/' },
} as const;

export type FeedId = keyof typeof feeds;
export interface TelemetryReading {
  value: number | string;
  time: string;
  cached?: boolean;
}
export type ExternalTelemetry = Partial<Record<FeedId, TelemetryReading>>;
