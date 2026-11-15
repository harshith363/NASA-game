import { shipLoad } from '../mission/lunarCampaign';
import { constructionTypes, type FacilityType } from '../mission/outpostSimulation';
import type { Building } from './buildings';
import type { PlayerGuide } from '../ui/playerGuide';

type OutpostCard = PlayerGuide['cards'][number] & { panel?: Building['id'] | 'rover' | 'departure'; facility?: FacilityType };
export const outpostGuide: Omit<PlayerGuide, 'cards'> & { cards: readonly OutpostCard[] } = {
  id: 'outpost',
  title: 'Outpost walkthrough',
  cards: [
    {
      title: 'Read the clock and supplies',
      target: '.sim-resources',
      instructions: [
        'The outpost starts paused. Press Play when you want the clock, construction, and supply use to start. Pause anytime to plan.',
        'At 1×, one mission day takes one real minute. The clock and resource amounts use fictional training values.',
        'Check power, food, water, oxygen, and materials at the top. A minus sign means a supply is being used faster than it is produced.',
      ],
    },
    {
      title: 'Solar array',
      target: '#sim-type',
      facility: 'solar',
      instructions: [
        `In Build, choose Solar array and select an empty plot. It costs ${constructionTypes.solar.cost} materials, and two astronauts build it while the clock runs.`,
        'An online array provides 5 power per day in clear conditions. During a solar storm, arrays generate 30% of their usual power.',
      ],
    },
    {
      title: 'Greenhouse',
      target: '#sim-type',
      facility: 'greenhouse',
      instructions: [
        `In Build, choose Greenhouse and pick another plot. It costs ${constructionTypes.greenhouse.cost} materials. Queue it after the solar array so you can supply the lights with power.`,
        'An online greenhouse with lights, water, and power grows food. Select an occupied plot in Build to see its status and controls.',
      ],
    },
    {
      title: 'Battery bank',
      target: '#sim-type',
      facility: 'battery',
      instructions: [
        `An optional Battery bank costs ${constructionTypes.battery.cost} materials. It adds room for 20 more units of power and fills as the arrays produce extra power.`,
        'Use it to store power before storms. Switching off a charged bank can discard power that no longer fits.',
      ],
    },
    {
      title: 'Farm controls',
      target: '[data-panel="farm"] label:has(#sim-grow-lights)',
      panel: 'farm',
      instructions: [
        'Keep the greenhouse lights on to grow food when the outpost has power and water. Switch them off to save power and water while crop growth is paused.',
        'The water recycler uses power and helps refill water reserves. In Jobs, Imani can harvest extra food and Mateo can tune the recycler.',
      ],
    },
    {
      title: 'Crew roster and jobs',
      target: '#sim-crew-roster h3',
      panel: 'control',
      instructions: [
        'The Control Tower roster shows who is available, walking to a job, working, or in shelter. Under Jobs, choose an available astronaut and select Assign job.',
        'Start with Aya servicing power equipment or Leena inspecting the shelter for earlier warnings.',
        'Use reserve oxygen here if needed. It saves power but draws from the oxygen supply.',
      ],
    },
    {
      title: 'Communications and forecasts',
      target: '#sim-forecast',
      panel: 'comms',
      instructions: [
        'Select Request forecast to see when the next solar storm is due. Request telemetry shows mission readings and any available observations from Earth.',
        'Under Jobs, assign Noah to Survey for supplies. A completed survey reveals caches within range of the outpost.',
      ],
    },
    {
      title: 'Get everyone into shelter',
      target: '#sim-panel-shelter',
      panel: 'control',
      instructions: [
        'A storm warning pauses the clock. Choose Recall crew in the briefing. If the rover is out, return it to the dock and unload so the driver can join the crew.',
        'Press Play to give the astronauts time to reach shelter. Check the crew count before the storm hits. Release them after it clears.',
        'Between storms, an equipment alert explains what broke and how to respond.',
      ],
    },
    {
      title: 'Take a short rover trip',
      target: '#rover-title',
      panel: 'rover',
      instructions: [
        'During clear conditions, select Rover dock, choose a driver, and select Board rover. If the clock is paused, press Play. Use W or ↑ to move forward, S or ↓ to reverse, and A/D or ←/→ to steer.',
        'Run Radar sweep and pick a nearby cache as a waypoint. Stop inside its marked area to collect it. Leave enough charge to get home.',
        'Drive back to the dock and select Dock & unload. This delivers cargo and frees the driver.',
      ],
    },
    {
      title: 'Prepare to go home',
      target: '#departure-time',
      panel: 'departure',
      instructions: [
        'Select Departure at the lander to check the next boarding window and what the ship needs. The first window is Days 13–15.',
        'Dock the rover, finish or cancel crew jobs, and release the crew from shelter when it is safe. Keep enough supplies to load the ship.',
        'When all checks pass during an open window, select Board return ship. Follow the return console to splashdown.',
      ],
    },
  ],
};

export const launchGuide: PlayerGuide = {
  id: 'launch',
  title: 'Launch briefing',
  cards: [{
    title: 'Before liftoff',
    instructions: [
      'Start spacecraft checks. Connect ground power, switch on avionics, and start life support.',
      'Align navigation, load the approved route, and confirm the alignment. Switch to onboard power and select Request GO.',
      'After Mission Control gives GO, select Authorize launch. Hold countdown gives you time to review. The ⓘ buttons explain individual commands.',
    ],
  }],
};

export const departureGuide: PlayerGuide = {
  id: 'departure',
  title: 'Lunar departure briefing',
  cards: [{
    title: 'Before boarding',
    instructions: [
      'Boarding opens on Days 13–15, then again on Days 28–30. If you miss a window, keep the outpost running and use the checklist to see the next opening.',
      'Dock the rover, finish or cancel assigned jobs, and release the crew from shelter when conditions are safe.',
      `Keep ${shipLoad.materials} materials, ${shipLoad.battery} power, ${shipLoad.oxygen} oxygen, and ${shipLoad.food} food. Board return ship loads those supplies and starts the flight home.`,
    ],
  }],
};
