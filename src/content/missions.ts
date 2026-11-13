import type { SourceId } from './references';

export const missionIds = ['apollo-11-descent-stage', 'opportunity'] as const;
export type MissionId = typeof missionIds[number];
type MissionRecord = {
  name: string;
  shortName: string;
  body: 'Moon' | 'Mars';
  historicalStatus: string;
  locationDescription: string;
  coordinates?: { latitude: number; longitude: number; precisionNote: string };
  launchOrLanding: string;
  endOfMission?: string;
  purpose: string;
  discoveriesOrLegacy: string[];
  leftBehindOrStoppedWhy: string;
  sourceIds: SourceId[];
  media: string[];
};
export const missions: Record<MissionId, MissionRecord> = {
  'apollo-11-descent-stage': {
    name: 'Apollo 11 Lunar Module Eagle — descent stage',
    shortName: 'Apollo 11', body: 'Moon', media: ['apollo', 'hardware'],
    historicalStatus: 'Inactive, left in place. NASA’s Lunar Reconnaissance Orbiter later photographed it on the surface.',
    locationDescription: 'Tranquility Base, Sea of Tranquility',
    coordinates: { latitude: 0.67409, longitude: 23.47298, precisionNote: 'Approximate historical landing-site coordinates.' },
    launchOrLanding: 'July 20, 1969',
    purpose: 'Land the first crew on the Moon and support their surface exploration.',
    discoveriesOrLegacy: ['First crewed lunar landing', 'The astronauts collected lunar samples and set up scientific experiments.', 'The site preserves equipment and tracks from the first crewed lunar landing.'],
    leftBehindOrStoppedWhy: 'The descent stage landed Eagle and served as the launch platform. The crew used the ascent stage to lift off, leaving the descent stage and other equipment at the site.',
    sourceIds: ['N1', 'N2', 'N3'],
  },
  opportunity: {
    name: 'Mars Exploration Rover Opportunity (MER-B)',
    shortName: 'Opportunity', body: 'Mars', media: ['rover', 'traverse', 'last-image'],
    historicalStatus: 'Inactive. NASA’s 2019 mission record places the rover on Mars at Perseverance Valley. Communication was never recovered.',
    locationDescription: 'Perseverance Valley, near Endeavour Crater (approximate final region)',
    launchOrLanding: 'January 24, 2004 (PST)',
    endOfMission: 'February 13, 2019',
    purpose: 'Investigate Martian geology and look for evidence of past water.',
    discoveriesOrLegacy: ['Found geological evidence of ancient water-related environments.', 'Drove 45.16 km over nearly 15 Earth years. Its original mission was designed for 90 sols.'],
    leftBehindOrStoppedWhy: 'A Mars-wide dust storm blocked sunlight from reaching the solar-powered rover. NASA received the last communication on June 10, 2018.',
    sourceIds: ['N4', 'N5', 'N6', 'N7'],
  },
};

export const opportunityTimeline = [
  ['Jan 24, 2004 (PST)', 'Landed at Eagle Crater', 'Designed for 90 sols'],
  ['Jun 10, 2018', 'Last contact', 'Dust storm cut available sunlight'],
  ['Feb 13, 2019', 'Mission declared complete', 'Total traverse of 45.16 km'],
];
