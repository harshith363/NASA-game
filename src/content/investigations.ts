export const artifactChoices = ['Descent stage', 'Ascent stage', 'Returned lunar samples'];
export const descentReasons = [
  'It was the landing platform; the ascent stage lifted off.',
  'It was forgotten by the astronauts.',
  'It was a failed spacecraft.',
];

export const evidence = [
  { id: 'arrival', assetId: 'eagle-crater', title: 'Eagle Crater', subtitle: 'Opportunity lands and looks around (2004).' },
  { id: 'discovery', assetId: 'rock', title: 'Clues in the rocks', subtitle: 'Opportunity studies minerals and textures shaped by ancient water.' },
  { id: 'legacy', assetId: 'traverse', title: 'The final traverse', subtitle: 'The rover explores for years and travels 45.16 km.' },
] as const;
export type EvidenceId = typeof evidence[number]['id'];
export const slots = ['Arrival', 'Discovery', 'Legacy'];
export const waterChoices = [
  'Past water-related conditions on Mars',
  'Cities built on Mars',
  'Living animals on Mars',
];
export const museumCaptions = [
  'Opportunity failed after just 90 days.',
  'Opportunity proved life exists on Mars.',
  'Opportunity revealed evidence of Mars’s watery past and explored for nearly 15 years.',
];
