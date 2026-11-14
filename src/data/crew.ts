export const crew = [
  { id: 'aya', name: 'Aya Chen', role: 'Power engineer', color: 0xffbb70, task: 'repair', detail: 'Repairs the solar controller in one shift. A backup needs two.' },
  { id: 'mateo', name: 'Mateo Silva', role: 'Life-support engineer', color: 0x8bdbef, task: 'recycle', detail: 'Tune the recycler so it uses no extra power today.' },
  { id: 'imani', name: 'Imani Okafor', role: 'Botanist', color: 0xa4dfa1, task: 'grow', detail: 'Adds two crop progress when lights and water are available.' },
  { id: 'leena', name: 'Leena Rao', role: 'Crew safety officer', color: 0xf1a5a9, task: 'safety', detail: 'Shelter checks reduce everyone else’s work cost by one readiness.' },
  { id: 'noah', name: 'Noah Reyes', role: 'Communications specialist', color: 0xc6b5ff, task: 'radio', detail: 'Compares lighting plans for up to two upcoming days.' },
] as const;

export const crewTasks = {
  rest: { name: 'Rest', cost: 0, outside: false },
  inspect: { name: 'Inspect solar controller', cost: 2, outside: true },
  repair: { name: 'Repair solar controller', cost: 2, outside: true },
  grow: { name: 'Adjust grow lights', cost: 2, outside: true },
  recycle: { name: 'Tune water recycler', cost: 2, outside: false },
  safety: { name: 'Run shelter checks', cost: 2, outside: false },
  radio: { name: 'Track the forecast', cost: 2, outside: false },
} as const;

export type CrewId = typeof crew[number]['id'];
export type CrewTask = keyof typeof crewTasks;
export type Assignments = Record<CrewId, CrewTask>;
export type Readiness = Record<CrewId, number>;

export const maxReadiness = 4;
export const resting: Assignments = { aya: 'rest', mateo: 'rest', imani: 'rest', leena: 'rest', noah: 'rest' };
export const freshCrew: Readiness = { aya: 4, mateo: 4, imani: 4, leena: 4, noah: 4 };

export function isAssignments(value: unknown): value is Assignments {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== crew.length) return false;
  const record = value as Partial<Assignments>;
  return crew.every(({ id }) => typeof record[id] === 'string' && Object.hasOwn(crewTasks, record[id]));
}

export function crewCost(member: typeof crew[number], task: CrewTask) {
  return crewTasks[task].cost - Number(member.task === task || (member.id === 'aya' && task === 'inspect'));
}
