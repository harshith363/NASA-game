export const buildings = [
  {
    id: 'farm',
    name: 'Farm',
    description: 'The greenhouse crops are already growing. Light during the storm helps them finish in time for tomorrow.',
    color: 0xa3dc94,
  },
  {
    id: 'control',
    name: 'Control Tower',
    description: 'Fast-moving particles from the Sun can harm astronauts. Thick shelter walls help protect the crew.',
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
