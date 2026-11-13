import { useEffect, useRef, useState, type Dispatch } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, FastForward, RotateCcw } from 'lucide-react';
import { prologueChoices, reflections, sceneIds, scenes, type SceneId, type Speaker, type Stage } from '../content/scenes';
import type { Action, SaveData } from '../app/gameReducer';
import { ArtifactCard, SolarSystemAtlas } from './Archive';
import { CinematicStage, RouteMotion, SignalFade } from './Cinematics';
import { Media, SourcesDrawer } from './Media';
import { ApolloPuzzle, Choices, OpportunityCaptionPuzzle, OpportunityEvidencePuzzle } from '../puzzles/Investigations';
import { opportunityTimeline } from '../content/missions';

const stages: Stage[] = ['Earth', 'Moon', 'Mars', 'Beyond'];
const stageNotes = ['Departure', 'What stayed?', 'Follow the water', 'The legacy'];

function StoryProgress({ id }: { id: SceneId }) {
  const stage = stages.indexOf(scenes[id].stage);
  return <nav aria-label="Story progress"><ol className="story-progress">
    {stages.map((item, index) => <li key={item} className={index <= stage ? 'reached' : ''} aria-current={index === stage ? 'step' : undefined}>
      <span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><small>{stageNotes[index]}</small>
    </li>)}
  </ol></nav>;
}

function DialoguePanel({ speaker, text, advance, label, captions }: { speaker: Speaker; text: string; advance: () => void; label: string; captions: boolean }) {
  const portrait = speaker !== 'Narrator';
  return <section className="dialogue panel" aria-label="Dialogue">
    <div className={`speaker-mark speaker-${speaker.toLowerCase()}${portrait ? ' illustrated' : ''}`} aria-hidden="true">
      {portrait ? <Media id={speaker.toLowerCase()} caption={false} /> : <BookOpen size={21} />}
    </div>
    <div className="dialogue-content" aria-live="polite" aria-atomic="true">
      <p className="eyebrow">{speaker} {portrait && <span className="portrait-credit">· Fictional illustration</span>}</p>
      <p className={captions ? 'spoken caption-style' : 'spoken'}>{text}</p>
    </div>
    <button className="button primary" data-advance onClick={advance}>{label} <ArrowRight size={18} /></button>
  </section>;
}

function MissionTimeline() {
  return <ol className="timeline" aria-label="Opportunity mission timeline">{opportunityTimeline.map(([date, title, note]) =>
    <li key={date}><time>{date}</time><strong>{title}</strong><span>{note}</span></li>
  )}</ol>;
}

export function StoryPage({ save, dispatch }: { save: SaveData; dispatch: Dispatch<Action> }) {
  const { currentSceneId: id, currentDialogueIndex: index, step, settings } = save;
  const scene = scenes[id];
  const [cinematicSkipped, setCinematicSkipped] = useState<SceneId | null>(null);
  const [puzzleRun, setPuzzleRun] = useState(0);
  const animate = cinematicSkipped !== id && !settings.reduceMotion;
  const focus = useRef<HTMLHeadingElement>(null);
  const previousBeat = useRef(`${id}:${step}`);
  useEffect(() => {
    const beat = `${id}:${step}`;
    if (previousBeat.current !== beat) focus.current?.focus({ preventScroll: true });
    previousBeat.current = beat;
  }, [id, step]);
  useEffect(() => {
    if (step !== 'dialogue' && step !== 'closing') return;
    function onSpace(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof HTMLElement && event.target.closest('button,a,input,summary,select,textarea,[contenteditable],[role="button"]')) return;
      event.preventDefault();
      dispatch({ type: 'next' });
    }
    window.addEventListener('keydown', onSpace);
    return () => window.removeEventListener('keydown', onSpace);
  }, [step, dispatch]);
  const next = () => dispatch({ type: 'next' });
  const solved = () => dispatch({ type: 'solved' });
  const dialogue = step === 'dialogue' ? scene.dialogue : scene.closing ?? [['ECHO', prologueChoices[save.prologueChoice ?? 0].response] as const];
  const line = dialogue[index];
  const lastLine = index === dialogue.length - 1;
  const assetId = id === 'L01' && index >= 1 ? 'apollo' :
    id === 'M01' && index >= 2 ? 'rover' :
    id === 'M03' && (index >= 5 || step !== 'dialogue') ? 'last-image' : scene.backgroundAssetId;
  const archiveShot = ['apollo', 'rover', 'eagle-crater', 'shadow', 'last-image'].includes(assetId);
  const isEvidence = step === 'puzzle' || (step === 'closing' && ['L02', 'M03'].includes(id));
  const showConstellation = id === 'B01' && (index >= 5 || step !== 'dialogue');
  const showRoute = (id === 'L01' || id === 'M01') && index === 0 && animate;
  const nextLabel = !lastLine ? 'Continue' :
    id === 'E00' ? 'Begin Journey' :
    step === 'dialogue' && (id === 'E01' || id === 'B01') ? 'Respond' :
    step === 'dialogue' && id === 'M03' ? 'Choose the museum caption' :
    id === 'B01' ? 'Complete journey' : scene.nextLabel ?? 'Continue';
  const sceneMedia = id === 'L01' ? ['flyby', 'apollo'] : id === 'M01' ? ['arrival', 'rover', 'traverse'] : id === 'M03' ? ['shadow', 'last-image'] : [assetId];
  return <main id="main" className={`story shell ${animate ? '' : 'static-motion'}`}>
    <StoryProgress id={id} />
    <section className={`story-screen ${isEvidence ? 'compact-screen' : ''} ${archiveShot ? 'archival-screen' : ''}`}>
      <CinematicStage key={assetId} assetId={assetId} animate={animate} />
      <div className="story-heading">
        <p className="eyebrow"><span className="live-dot" /> {scene.stage} / {id}</p>
        <h1 ref={focus} tabIndex={-1}>{scene.title}</h1>
        <p>{scene.location}</p>
        {id === 'M01' && <span className="location-tag">Months later</span>}
      </div>
      {showRoute && <RouteMotion mars={id === 'M01'} />}
      {id === 'L01' && assetId === 'apollo' && <span className="location-tag photo-tag"><span className="live-dot" /> Tranquility Base · Descent stage and tracks</span>}
      {id === 'M03' && assetId === 'shadow' && <SignalFade />}
    </section>
    <div className="story-body">
      {id === 'E00' && <p className="notice">Odyssey · Student expedition to Mars · A fictional future. A real history.</p>}
      {id === 'M03' && assetId === 'last-image' && <div className="last-record panel">
        <Media id="last-image" />
        <div><p className="eyebrow">June 10, 2018 · Sol 5,111</p>
          <h2>Opportunity’s incomplete Pancam transmission</h2>
          <p>Black pixels mark the missing part of the full-frame downlink. Opportunity took another set of images about three minutes later. Thumbnails from that set reached Earth.</p>
          <SourcesDrawer ids={['N6']} />
        </div>
      </div>}
      {showConstellation && <SolarSystemAtlas finale />}
      {(step === 'dialogue' || step === 'closing') && line && <DialoguePanel speaker={line[0]} text={line[1]} advance={next} label={nextLabel} captions={settings.captionsEnabled} />}
      {id === 'E01' && step === 'choice' && <section className="panel puzzle-panel"><p className="eyebrow">Legacy Archive</p><h2>What do you want to uncover?</h2>
        <p>Each Archive Card records the artifact, location, mission, science, status, and sources.</p>
        <Choices options={prologueChoices.map(({ option }) => option)} onChoose={index => dispatch({ type: 'choose', index })} />
      </section>}
      {id === 'B01' && step === 'choice' && <section className="panel puzzle-panel"><p className="eyebrow">Closing reflection</p><h2>What makes a mission worth remembering?</h2>
        <Choices options={reflections} onChoose={index => dispatch({ type: 'choose', index })} />
      </section>}
      {step === 'puzzle' && id === 'L02' && <ApolloPuzzle key={puzzleRun} onComplete={solved} />}
      {step === 'puzzle' && id === 'M02' && <OpportunityEvidencePuzzle key={puzzleRun} onComplete={solved} />}
      {step === 'puzzle' && id === 'M03' && <OpportunityCaptionPuzzle key={puzzleRun} onComplete={solved} />}
      {id === 'L02' && step === 'closing' && <ArtifactCard id="apollo-11-descent-stage" restored />}
      {id === 'M03' && ['puzzle', 'closing'].includes(step) && <MissionTimeline />}
      {id === 'M03' && step === 'closing' && <ArtifactCard id="opportunity" restored />}
      {id === 'M01' && index >= 6 && <details className="sources-drawer route-record"><summary>Inspect the official traverse map</summary><Media id="traverse" /></details>}
      {step === 'end' && <section className="panel ending">
        <p className="eyebrow">Legacy Archive restored</p>
        <h2>Some missions end.<br />Their discoveries do not.</h2>
        <blockquote>{save.closingReflection}</blockquote>
        <p>Odyssey, its crew, and the year-2047 expedition are fictional. The NASA mission history and cited archival images are real.</p>
        <p className="muted">Future archive · Viking, Ingenuity, Cassini and more</p>
        <div className="actions">
          <Link className="button primary" to="/archive">Explore the Archive <ArrowRight size={18} /></Link>
          <button className="button secondary" onClick={() => { setCinematicSkipped(null); dispatch({ type: 'replay' }); }}>Replay Story</button>
          <Link className="button secondary" to="/sources">View NASA Sources</Link>
        </div>
      </section>}
      {(scene.sourceIds || id === 'E01' || id === 'B01') && <SourcesDrawer ids={scene.sourceIds ?? []} media={line && line[0] !== 'Narrator' ? [...sceneMedia, line[0].toLowerCase()] : sceneMedia} />}
      <div className="story-controls">
        {id !== 'E00' && <button className="button subtle" onClick={() => { setCinematicSkipped(null); dispatch({ type: 'back' }); }}><ArrowLeft size={16} /> Back</button>}
        {step !== 'end' && <button className="button subtle" onClick={() => { setCinematicSkipped(null); setPuzzleRun(run => run + 1); dispatch({ type: 'restart' }); }}><RotateCcw size={16} /> Replay scene</button>}
        {animate && <button className="button subtle" onClick={() => setCinematicSkipped(id)}><FastForward size={16} /> Skip animation</button>}
        {id === 'E00' && <Link className="button subtle" to="/archive">Explore Archive</Link>}
        <span className="scene-count">Scene {sceneIds.indexOf(id) + 1} / {sceneIds.length}</span>
      </div>
    </div>
  </main>;
}
