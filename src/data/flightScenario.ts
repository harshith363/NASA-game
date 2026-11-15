export const phases = ['briefing', 'startup', 'clearance', 'countdown', 'ascent', 'earthOrbit', 'departure', 'engineIncident', 'coast', 'oxygenIncident', 'lunarOrbit', 'descent', 'touchdown', 'debrief', 'outpost'] as const;
export type FlightPhase = typeof phases[number];
export type Reserves = { fuel: number; battery: number; oxygen: number };
export const costs = {
  ignite: { fuel: 4, battery: 1, oxygen: 1 },
  depart: { fuel: 4, battery: 1, oxygen: 1 },
  cool: { fuel: 1, battery: 3, oxygen: 1 },
  thrusters: { fuel: 3, battery: 1, oxygen: 0 },
  coast: { fuel: 0, battery: 1, oxygen: 2 },
  repair: { fuel: 0, battery: 3, oxygen: 1 },
  bypass: { fuel: 0, battery: 1, oxygen: 3 },
  capture: { fuel: 3, battery: 1, oxygen: 1 },
  land: { fuel: 3, battery: 1, oxygen: 1 },
} satisfies Record<string, Reserves>;
export const phaseCopy: Record<FlightPhase, [string, string, string]> = {
  briefing: ['Earth to Moon', 'Leena', 'Reach the Moon with landing reserves. Every repair uses supplies. Your crew can help you compare.'],
  startup: ['Power up spacecraft', 'Aya', 'Ground power runs our checks without using flight battery. Once avionics are online, check the cabin and route in either order.'],
  clearance: ['Earth launch control', 'Noah', 'Transfer to onboard power, then ask Earth Tower to review our checks. This is separate from the outpost Control Tower.'],
  countdown: ['Cleared for launch', 'Tower', 'Your launch authorization starts T−10. You can hold the countdown before ignition.'],
  ascent: ['Liftoff', 'Pilot', 'Ignition. Clearing the tower. The launch vehicle carries our spacecraft upward; spent stages separate.'],
  earthOrbit: ['Earth parking orbit', 'Pilot', 'We check the spacecraft in Earth orbit before the departure burn. Compare the fuel needed now with what we need to land.'],
  departure: ['Leaving Earth orbit', 'Pilot', 'Departure burn complete. Our fictional route now heads toward the Moon.'],
  engineIncident: ['Correction burn · cooling warning', 'Aya', 'Inspect the coolant system. A backup pump uses battery; backup thrusters use more fuel. Both can complete the correction.'],
  coast: ['A window on Earth', 'Noah', 'Look back at Earth. The Moon is about 384,400 km away on average. Continue journey compresses the coast and spends supplies once.'],
  oxygenIncident: ['Cabin · supply-line leak', 'Mateo', 'Isolate the faulty line first. Oxygen supplies breathing air; the scrubber removes carbon dioxide. Keep the scrubber running on either path.'],
  lunarOrbit: ['Lunar approach', 'Pilot', 'Authorize the braking maneuver, then check the landing site and transfer to the lander.'],
  descent: ['Landing checklist', 'Leena', 'Confirm the site and lander before authorizing descent. Our combined reserves represent the whole mission, not separate vehicle tanks.'],
  touchdown: ['Powered descent', 'Pilot', 'Guidance is locked. The lander is slowing for touchdown.'],
  debrief: ['Your flight report', 'Leena', 'You brought the crew to the Moon. Repairs traded fuel, power and breathing supplies. Outpost day one starts with its own standard supplies.'],
  outpost: ['Outpost ready', 'Imani', 'Welcome to the lunar outpost. Survive fifteen mission days and prepare for the return to Earth.'],
};
export const labels = {
  start: 'Start spacecraft checks', ground: 'Connect ground power', avionics: 'Power avionics', life: 'Start life support · CO₂ scrubber', align: 'Align navigation', route: 'Load approved route', confirm: 'Confirm alignment', onboard: 'Switch to onboard power', go: 'Request GO', authorize: 'Authorize launch', ignite: 'Ignition', orbit: 'Complete ascent', depart: 'Authorize departure burn', transfer: 'Complete departure', inspect: 'Inspect coolant warning', cool: 'Cool and restart', thrusters: 'Use backup thrusters', coast: 'Continue journey', isolate: 'Isolate faulty supply line', repair: 'Power the repair tool', bypass: 'Use reserve bypass', capture: 'Authorize lunar braking', checklist: 'Confirm landing site and lander', land: 'Authorize descent', touchdown: 'Complete touchdown', report: 'Review flight report', acknowledge: 'Acknowledge result', finish: 'Enter outpost day one',
} as const;
export type FlightAction = keyof typeof labels;
export const lessons: Partial<Record<FlightAction, string>> = {
  ground: 'Aya: Ground power connected. The power bus is online.', avionics: 'Aya: Displays online. The approved route card is MOON-01.',
  life: 'Mateo: Cabin pressure checked, oxygen supply connected and CO₂ scrubber running. Adding oxygen does not remove CO₂.',
  align: 'Leena: Navigation mismatch. Onboard TRAIN-02 does not match Tower’s MOON-01. Load the approved route, then confirm alignment.',
  route: 'Leena: Approved MOON-01 route loaded. Confirm alignment to clear the fault.', confirm: 'Leena: Navigation aligned. Both cards now show MOON-01.',
  onboard: 'Aya: Onboard power confirmed. The cabin stays online.', go: 'Tower: Cabin, route and onboard power checked. GO for launch.',
  cool: 'The backup cooling pump completed the correction. The longer repair spent battery and cabin oxygen while saving fuel.',
  thrusters: 'Backup thrusters completed the correction sooner, using more maneuvering fuel and less battery.',
  repair: 'Mateo: Patch pressure-tested. Breathing supply restored; CO₂ removal remains running. The repair tool spent battery to preserve oxygen.',
  bypass: 'Mateo: Reserve bypass connected. CO₂ removal remains running. The lost oxygen includes the leak and supply left inaccessible in the isolated branch.',
};
