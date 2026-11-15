export const lunarLandmarks = {
  genesis: {
    name: 'Genesis Ridge', point: [-20, 21], sample: 'anorthosite',
    history: 'At Spur Crater in the Hadley–Apennine region, the Apollo 15 crew collected the pale Genesis Rock. It is anorthosite, a rock rich in feldspar that helps scientists understand the Moon’s early crust.',
    photo: '/media/apollo15-genesis.webp',
    alt: 'A pale angular rock perched above gray soil and fragments at Spur Crater.',
    caption: 'Genesis Rock at Apollo 15 Station 7 before collection. NASA, AS15-86-11671.',
    source: 'https://www.nasa.gov/history/50-years-ago-apollo-15-on-the-moon-at-hadley-apennine/',
  },
  northRay: {
    name: 'North Ray Highlands', point: [19, -22], sample: 'highlands breccia',
    history: 'Apollo 16 explored the Descartes highlands and collected rocks around North Ray Crater. Impacts can shatter rock and cement the fragments together. The resulting rock is called breccia.',
    photo: '/media/apollo16-north-ray.webp',
    alt: 'An Apollo astronaut stands beside a lunar rover on the rocky rim of North Ray Crater.',
    caption: 'Charles Duke beside the rover at North Ray Crater during Apollo 16. NASA, AS16-116-18607.',
    source: 'https://www.nasa.gov/history/apollo-16-on-the-moon-at-descartes/',
  },
  orangeGlass: {
    name: 'Orange Glass Crater', point: [13, 26], sample: 'orange glass-bearing soil',
    history: 'At Shorty Crater in Taurus–Littrow, Apollo 17 geologist Harrison Schmitt spotted orange soil. Tiny glass beads formed from droplets of molten rock and preserve evidence of ancient volcanic eruptions.',
    photo: '/media/apollo17-shorty.webp',
    alt: 'Harrison Schmitt and the lunar rover at the rim of Shorty Crater above the rocky crater floor.',
    caption: 'Harrison Schmitt at Shorty Crater. Photograph by Eugene Cernan, Apollo 17 Crew / NASA.',
    source: 'https://science.nasa.gov/image-article/apod-2015-august-2-apollo-17-at-shorty-crater/',
  },
} as const;

export type LandmarkId = keyof typeof lunarLandmarks;
export const landmarkIds = Object.keys(lunarLandmarks) as LandmarkId[];
export const landmarkRadius = 4;
export type SpecimenStatus = 'visited' | 'aboard' | 'delivered';
