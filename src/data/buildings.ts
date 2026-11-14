export const buildings = [
  {
    id: 'farm',
    name: 'Farm',
    description: 'Light and water help crops mature. A harvest adds fresh food to your stored meals.',
    color: 0xa3dc94,
  },
  {
    id: 'control',
    name: 'Mission Control Tower',
    description: 'Check power, air, and the particle forecast before you choose where the crew will work.',
    color: 0xffbc71,
  },
  {
    id: 'comms',
    name: 'Communications Centre',
    description: 'Send messages to Earth and receive updates from Mission Control.',
    color: 0x97d9f3,
  },
] as const;

export type Building = (typeof buildings)[number];
