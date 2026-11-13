const science = 'https://science.nasa.gov/';
export const references = {
  N1: ['Apollo 11 mission overview', 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11ov.html'],
  N2: ['Apollo 11 landing site from lunar orbit', science + 'resource/apollo-11-landing-site/'],
  N3: ['Log of Apollo 11', 'https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/apollo11_log/log.htm'],
  N4: ['Opportunity mission record', science + 'mission/mer-opportunity/'],
  N5: ['NASA announces the end of Opportunity’s mission', science + 'missions/mer/nasas-opportunity-rover-mission-on-mars-comes-to-end/'],
  N6: ['Opportunity’s Last Message · Pancam data and context', science + 'resource/opportunitys-last-message/'],
  N7: ['Opportunity’s final traverse map', science + 'photojournal/opportunitys-final-traverse-map/'],
  N8: ['Mars Exploration Rovers · Spirit and Opportunity', science + 'mission/mars-exploration-rovers-spirit-and-opportunity/'],
  EAGLE: ['Eagle photographed from Columbia', science + 'resource/the-eagle-prepares-to-land/'],
  SELFIE: ['Opportunity’s first selfie · PIA22222', science + 'photojournal/opportunitys-first-selfie/'],
  ROCK: ['Evidence of a Water-Soaked Past · PIA05495', science + 'photojournal/evidence-of-a-water-soaked-past/'],
  CRATER: ['Eagle Crater panorama · PIA05755', science + 'photojournal/opportunity-captures-lion-king-panorama/'],
  SHADOW: ['Opportunity catches its shadow', science + 'resource/opportunity-catches-its-shadow/'],
  MEDIA: ['NASA image and media guidelines', 'https://www.nasa.gov/nasa-brand-center/images-and-media/'],
  CH1: ['Space Apps 2026 · Abandoned but not Forgotten', 'https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources'],
  CH2: ['Space Apps 2026 · Junior Astronaut Mission Trainer', 'https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/'],
} as const;
export type SourceId = keyof typeof references;
