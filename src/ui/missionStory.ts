import { crew } from '../data/crew';
import type { Building } from '../data/buildings';
import type { DayResult, MissionState } from '../mission/dailyMission';

export function missionBeat(state: MissionState, result: DayResult) {
  switch (result.day) {
    case 1: return { speaker: crew[2], title: 'Get the garden growing', line: 'We have stored meals. Let’s grow a fresh crop before they run low.', building: 'farm', action: 'Plan the harvest' } as const;
    case 2: return { speaker: crew[3], title: 'A particle alert is coming', line: 'We have a day to prepare. I’ll show you when to move inside.', building: 'control', action: 'View storm briefing', storm: true } as const;
    case 3: return { speaker: crew[3], title: 'Move the crew inside', line: 'Particle levels are rising. Let’s choose shelter and postpone outside work.', building: 'control', action: 'Set crew protection' } as const;
    case 4: return { speaker: crew[1], title: 'Keep the air running', line: 'The alert is at its peak. Check what the fan and air supply will cost.', building: 'control', action: 'Compare air supplies' } as const;
    case 5: return state.controller === 'repaired'
      ? { speaker: crew[2], title: 'Return to the greenhouse', line: 'The alert has passed. We can get back to crop work.', building: 'farm', action: 'Resume crop work' } as const
      : { speaker: crew[0], title: 'Restore solar output', line: 'Outside work is available again. A controller repair adds power on later days.', building: 'control', action: 'Review controller work' } as const;
    case 6: return { speaker: crew[4], title: 'Check the final supply window', line: 'I can compare lighting plans for tomorrow and show what each leaves in reserve.', building: 'comms', action: 'Plan with Noah' } as const;
    default: return { speaker: crew[2], title: 'Prepare for handover', line: 'Check the last harvest and make sure we leave enough food and battery.', building: (result.next.food < 2 ? 'farm' : 'control') as Building['id'], action: 'Check final supplies' } as const;
  }
}
