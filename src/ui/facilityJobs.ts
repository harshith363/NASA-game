import { crew, crewTasks, type CrewId, type CrewTask } from '../data/crew';
import { previewDay, type DailyPlan, type DayResult, type MissionState } from '../mission/dailyMission';

const byId = (id: string) => document.getElementById(id)!;

export function mountFacilityJobs(apply: (assignments: DailyPlan['assignments']) => void) {
  const jobs = [
    { panel: 'farm', member: crew[2], task: 'grow' },
    { panel: 'farm', member: crew[1], task: 'recycle' },
    { panel: 'control', member: crew[0], task: 'inspect' },
    { panel: 'control', member: crew[3], task: 'safety' },
    { panel: 'comms', member: crew[4], task: 'radio' },
  ].map(({ panel, member, task }) => {
    const card = document.createElement('article');
    card.className = 'job-card';
    card.style.setProperty('--crew-accent', `#${member.color.toString(16)}`);
    const heading = document.createElement('h3');
    const picture = document.createElement('img');
    picture.src = `/media/crew-${member.id}.webp`;
    picture.width = picture.height = 40;
    picture.alt = '';
    const skill = document.createElement('p');
    const choice = document.createElement('select');
    choice.setAttribute('aria-label', `Choose astronaut for ${member.role} work`);
    for (const astronaut of [member, ...crew.filter(({ id }) => id !== member.id)]) {
      choice.add(new Option(astronaut.name, astronaut.id));
    }
    const impact = document.createElement('p');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'radio-action';
    const controls = document.createElement('div');
    controls.className = 'job-actions';
    controls.append(choice, button);
    const reset = () => { choice.value = member.id; };
    card.append(picture, heading, skill, controls, impact);
    byId(`${panel}-jobs`).append(card);
    return { card, member, task: task as CrewTask, heading, skill, choice, impact, button, reset };
  });
  let current: { state: MissionState; plan: DailyPlan; result: DayResult };
  let day = 0;

  function update(job: typeof jobs[number]) {
    const { state, plan, result } = current;
    const task = job.task === 'inspect' && state.controller !== 'uninspected' ? 'repair' : job.task;
    job.card.hidden = (task === 'repair' && state.controller === 'repaired') || (task === 'recycle' && result.day === 1) || (task === 'radio' && result.day === 7);
    if (job.card.hidden) return;
    const active = crew.find(({ id }) => plan.assignments[id] === task);
    if (active) job.choice.value = active.id;
    const id = job.choice.value as CrewId;
    const person = crew.find(member => member.id === id)!;
    const assignment = plan.assignments[id];
    const assigned = assignment === task;
    const assignments = { ...plan.assignments, [id]: assigned ? 'rest' : task } as DailyPlan['assignments'];
    const proposed = previewDay(state, { ...plan, assignments });
    const start = state.readiness[id];
    const finish = proposed.next.readiness[id];
    const effect = task === 'inspect' ? 'Unlocks a controller repair.'
      : task === 'repair' ? (id === 'aya' || state.controller === 'partly-repaired' ? '+1 solar power on future days.' : 'Completes the first of two repair shifts.')
      : task === 'grow' ? `+${id === 'imani' ? 2 : 1} crop growth with light and water.`
      : task === 'recycle' ? (id === 'mateo' ? 'Uses 1 less power today.' : 'Recovers up to 1 extra water.')
      : task === 'safety' ? (id === 'leena' ? 'Other crew spend 1 less readiness.' : 'Shelter checks use the usual crew readiness costs.')
      : `Compares lighting choices for up to ${id === 'noah' ? 2 : 1} upcoming ${id === 'noah' ? 'days' : 'day'}.`;
    const error = proposed.operations.errors[id];
    const conflict = assignment !== 'rest' && !assigned;
    const invalid = Object.keys(proposed.operations.errors).length > 0;
    job.heading.textContent = crewTasks[task].name;
    job.skill.textContent = `Recommended · ${job.member.name} · ${job.member.role}`;
    job.choice.disabled = Boolean(active);
    job.button.textContent = assigned ? 'Remove job' : `Assign ${person.name.split(' ')[0]}`;
    job.button.disabled = !assigned && (conflict || invalid);
    const changes = [];
    if (proposed.next.battery !== result.next.battery) changes.push(`Battery ${result.next.battery} → ${proposed.next.battery}`);
    if (proposed.next.water !== result.next.water) changes.push(`Water ${result.next.water} → ${proposed.next.water}`);
    if (proposed.growth !== result.growth) changes.push(`Crop gain ${result.growth} → ${proposed.growth}`);
    if (proposed.harvest && !result.harvest) changes.push('Harvest ready today');
    job.impact.textContent = assigned ? `Planned · ${effect} Readiness ${start} → ${result.next.readiness[id]}.`
      : conflict ? `${person.name} already has a job. Change it in Crew.`
      : error || (invalid ? 'Resolve the conflicting assignment in Crew.' : `${effect} Readiness ${start} → ${finish}.${changes.length ? ` ${changes.join(' · ')}.` : ''}`);
    job.button.onclick = () => apply(assignments);
  }

  for (const job of jobs) job.choice.addEventListener('change', () => update(job));
  return (state: MissionState, plan: DailyPlan, result: DayResult) => {
    current = { state, plan, result };
    for (const job of jobs) {
      if (day !== result.day) job.reset();
      update(job);
    }
    day = result.day;
  };
}
