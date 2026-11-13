export const sceneIds = ['E00', 'E01', 'L01', 'L02', 'M01', 'M02', 'M03', 'B01'] as const;
export type SceneId = typeof sceneIds[number];
export type Stage = 'Earth' | 'Moon' | 'Mars' | 'Beyond';
export type Speaker = 'Ari' | 'Maya' | 'Leo' | 'Sam' | 'ECHO' | 'Narrator';
type Line = [speaker: Speaker, text: string];
type Scene = {
  stage: Stage;
  title: string;
  location: string;
  backgroundAssetId: string;
  estimatedSeconds: number;
  dialogue: Line[];
  closing?: Line[];
  puzzleId?: string;
  nextLabel?: string;
  sourceIds?: string[];
};
export const scenes: Record<SceneId, Scene> = {
  E00: {
    stage: 'Earth', title: 'The distance between worlds', location: '2047 · Earth orbit',
    backgroundAssetId: 'earth', estimatedSeconds: 30,
    dialogue: [['Narrator', 'Every journey begins long before the travelers arrive.']],
  },
  E01: {
    stage: 'Earth', title: 'An unfinished story', location: 'Odyssey · Observation deck',
    backgroundAssetId: 'deck', estimatedSeconds: 90,
    dialogue: [
      ['Leo', "Mars. We're actually going to Mars."],
      ['Maya', 'First, weeks of travel. And a lot of looking out this window.'],
      ['Ari', 'I can live with that view.'],
      ['Sam', 'Do you ever wonder who made a journey like this possible?'],
      ['ECHO', 'I have a collection you may find interesting. It is called the Legacy Archive.'],
      ['Ari', 'What does it collect?'],
      ['ECHO', 'Machines humanity sent into space—and, in some cases, never brought home.'],
      ['Leo', 'So... old space junk?'],
      ['ECHO', 'Some are historic artifacts. Others recorded discoveries that changed our understanding of entire worlds.'],
      ['Sam', "Then why does this archive say ‘INCOMPLETE’?"],
      ['ECHO', 'The images survived. The mission logs survived. But the stories connecting them have not yet been written.'],
      ['Maya', "Then let's find the evidence and write those stories."],
      ['ECHO', 'First stop: a place close enough to see, and far enough to change history.'],
    ],
    nextLabel: 'Begin lunar flyby',
  },
  L01: {
    stage: 'Moon', title: "The place we didn’t take home", location: 'Odyssey · Lunar flyby',
    backgroundAssetId: 'flyby', estimatedSeconds: 40, nextLabel: 'Inspect the landing site',
    sourceIds: ['N1', 'N2', 'N3'],
    dialogue: [
      ['Sam', 'We can see the Moon. Could we see the landing sites?'],
      ['ECHO', "From here, not with the naked eye. But NASA's Lunar Reconnaissance Orbiter photographed the Apollo 11 site decades after the landing."],
      ['Maya', 'Something is still there.'],
      ['ECHO', "Yes. Apollo 11's lunar module descent stage remained on the surface."],
      ['Leo', 'Wait—the astronauts left part of their spacecraft behind?'],
      ['ECHO', 'They used the ascent stage to depart. The descent stage stayed.'],
    ],
  },
  L02: {
    stage: 'Moon', title: 'What stayed?', location: 'Legacy Archive · Tranquility Base',
    backgroundAssetId: 'apollo', estimatedSeconds: 80, nextLabel: 'Continue to Mars',
    sourceIds: ['N1', 'N2', 'N3'], puzzleId: 'apollo-artifact-v1', dialogue: [],
    closing: [
      ['Ari', "So it wasn't abandoned because it failed."],
      ['Sam', 'It was left because the mission succeeded.'],
      ['ECHO', 'Archive entry restored: Apollo 11.'],
    ],
  },
  M01: {
    stage: 'Mars', title: 'A road no one could walk', location: 'Odyssey · Mars approach',
    backgroundAssetId: 'arrival', estimatedSeconds: 45, nextLabel: 'Investigate Opportunity',
    sourceIds: ['N4', 'N5', 'N7'],
    dialogue: [
      ['Leo', "Now that’s a planet."],
      ['Ari', 'Did humans really explore all of that before we arrived?'],
      ['ECHO', 'Robotic explorers did. One was meant to operate for about 90 Martian days.'],
      ['Maya', 'And how long did it last?'],
      ['ECHO', 'Almost fifteen Earth years.'],
      ['Sam', 'Opportunity.'],
      ['ECHO', "It came to Mars to search for clues that water once shaped this world. Let's follow the evidence."],
    ],
  },
  M02: {
    stage: 'Mars', title: 'Follow the water', location: 'Legacy Archive · Opportunity field records',
    backgroundAssetId: 'eagle-crater', estimatedSeconds: 135, nextLabel: 'Open final mission record',
    sourceIds: ['N4', 'N7', 'ROCK', 'CRATER'], puzzleId: 'opportunity-evidence-v1', dialogue: [],
    closing: [
      ['Maya', "The rover didn't find a Martian ocean. It found clues in the rocks."],
      ['ECHO', 'Exactly. Good science often begins by learning what evidence can—and cannot—tell us.'],
      ['Leo', 'And a 90-day mission kept discovering things for years?'],
      ['ECHO', 'Nearly fifteen years.'],
    ],
  },
  M03: {
    stage: 'Mars', title: 'The last image', location: 'Legacy Archive · Perseverance Valley',
    backgroundAssetId: 'shadow', estimatedSeconds: 120, nextLabel: 'Finish the Archive',
    sourceIds: ['N4', 'N5', 'N6', 'N7'], puzzleId: 'opportunity-caption-v1',
    dialogue: [
      ['ECHO', 'In June 2018, a planet-wide dust storm darkened the sky above Opportunity.'],
      ['Maya', "Its solar panels couldn't get enough sunlight."],
      ['ECHO', "The rover's last communication was received on June 10, 2018."],
      ['Ari', 'Was anyone able to reach it again?'],
      ['ECHO', 'NASA tried. On February 13, 2019, the mission was declared complete.'],
      ['Narrator', "One of Opportunity's last transmitted image products, June 10, 2018. The full-frame transmission was incomplete."],
      ['Sam', 'Then its last chapter was a failure?'],
      ['Leo', 'It went farther and lasted longer than anyone expected.'],
      ['Maya', 'And it changed what we know about Mars.'],
      ['ECHO', 'A mission can end without its discoveries ending.'],
    ],
    closing: [
      ['Ari', "We didn't come here to rescue a rover."],
      ['Sam', 'We came to remember what it showed us.'],
      ['ECHO', 'Archive entry restored: Opportunity.'],
    ],
  },
  B01: {
    stage: 'Beyond', title: 'What we leave behind', location: 'Odyssey · Looking outward from Mars',
    backgroundAssetId: 'window', estimatedSeconds: 60,
    dialogue: [
      ['ECHO', 'Two entries restored. Two different reasons a machine stopped moving.'],
      ['Maya', 'On the Moon, a part was left behind because the mission succeeded.'],
      ['Leo', 'On Mars, a rover outlived every expectation—and finally went silent.'],
      ['Sam', 'Both left something more important than hardware.'],
      ['Ari', 'Knowledge.'],
      ['ECHO', "The archive's question remains: What makes a mission worth remembering?"],
    ],
    closing: [['ECHO', 'All three belong in the story.']],
  },
};
export const prologueChoices = [
  { option: 'Show me what was left behind.', response: 'We begin with the Moon.' },
  { option: 'Show me why it mattered.', response: 'That is exactly the question.' },
];
export const reflections = ['What it taught us.', 'What it made possible.', 'The people who kept asking questions.'];
