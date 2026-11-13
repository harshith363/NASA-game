import { useEffect, useReducer, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, AudioLines, BookOpen, Compass, Orbit, Settings2, VolumeX, X } from 'lucide-react';
import { gameReducer, type SaveData } from './app/gameReducer';
import { readSave, writeSave } from './app/persistence';
import { ArchivePage, ArtifactDetail } from './components/Archive';
import { CinematicStage } from './components/Cinematics';
import { SourceLinks } from './components/Media';
import { StoryPage } from './components/Story';
import { assets } from './content/assets';
import { scenes } from './content/scenes';
import { ApolloPuzzle, OpportunityCaptionPuzzle, OpportunityEvidencePuzzle } from './puzzles/Investigations';

const chapters = [
  ['01', 'Earth', 'The departure', 'earth'],
  ['02', 'Moon', 'What stayed?', 'flyby'],
  ['03', 'Mars', 'Follow the water', 'arrival'],
  ['04', 'Beyond', 'What we leave behind', 'window'],
];

function Home({ save, begin }: { save: SaveData; begin: () => void }) {
  const started = save.currentSceneId !== 'E00';
  return <main id="main">
    <section className="home-hero">
      <CinematicStage assetId="earth" />
      <div className="shell hero-inner">
        <p className="eyebrow"><span className="live-dot" /> 2047 <span className="eyebrow-divider" /> Earth orbit</p>
        <h1>ECHOES<span>The Last Archive</span></h1>
        <p className="hero-description">Aboard Odyssey, follow the evidence left behind by Apollo 11 and the Opportunity rover.</p>
        <div className="actions">
          <button className="button primary" onClick={begin}>Begin Journey <ArrowRight size={20} /></button>
          {started && <Link className="button secondary" to="/story">Continue Journey <ArrowRight size={18} /></Link>}
          <Link className="button secondary" to="/archive"><Compass size={18} /> Explore Archive</Link>
        </div>
        <p className="opening-caption">“Every journey begins long before the travelers arrive.”</p>
        <p className="mission-note">10-minute mission <span>·</span> A fictional future. A real history.</p>
      </div>
      <div className="hero-frame" aria-hidden="true" />
    </section>
    <section className="shell chapter-section" aria-labelledby="flight-plan">
      <div className="section-heading"><h2 id="flight-plan">Flight plan</h2><span>Earth orbit → Mars</span></div>
      <ol className="chapter-grid">{chapters.map(([num, stage, title, asset]) => <li key={num}>
        <CinematicStage assetId={asset} animate={false} />
        <div className="chapter-content"><p className="eyebrow">{num} / {stage}</p><h3>{title}</h3></div>
      </li>)}</ol>
    </section>
  </main>;
}

function SourcesPage() {
  return <main id="main" className="shell interior">
    <div className="page-heading"><p className="eyebrow">Legacy Archive</p><h1>Sources &amp; credits</h1><p>Read the NASA mission records and trace each image to its original source.</p></div>
    <div className="source-columns">
      <section className="panel"><h2>Apollo 11</h2><SourceLinks ids={['N1', 'N2', 'N3', 'EAGLE']} /></section>
      <section className="panel"><h2>Opportunity</h2><SourceLinks ids={['N4', 'N5', 'N6', 'N7', 'N8', 'SELFIE', 'ROCK', 'CRATER', 'SHADOW']} /></section>
      <section className="panel"><h2>NASA Space Apps</h2><SourceLinks ids={['CH1', 'CH2', 'MEDIA']} />
        <p>Odyssey, its students, and the expedition are fictional. This educational game is independently produced.</p></section>
    </div>
    <section className="panel credit-register"><h2>Image register</h2><ul>{Object.values(assets).map(asset => <li key={asset.id}>
      <strong>{asset.title}</strong><span>{asset.authenticityLabel} · {asset.credit} · {asset.usageReviewed ? 'Usage reviewed' : 'Review pending'}</span>
      {asset.sourceUrl && <a href={asset.sourceUrl} target="_blank" rel="noreferrer">Original <ArrowUpRight size={15} /></a>}
    </li>)}</ul></section>
  </main>;
}

function ReplayPuzzle() {
  const { id } = useParams();
  const [phase, setPhase] = useState(0);
  const apollo = id === 'apollo-11-descent-stage';
  if (!apollo && id !== 'opportunity') return <ArtifactDetail restored={[]} />;
  return <main id="main" className="shell interior">
    <Link className="text-link" to={`/archive/${id}`}>← Return to record</Link>
    <h1 className="page-title">Replay {apollo ? 'Apollo 11' : 'Opportunity'} investigation</h1>
    {phase === 2 ? <div className="panel"><h2>Investigation complete</h2><Link className="button primary" to={`/archive/${id}`}>Return to record</Link></div> :
      apollo ? <ApolloPuzzle onComplete={() => setPhase(2)} /> :
      phase === 0 ? <OpportunityEvidencePuzzle onComplete={() => setPhase(1)} /> :
      <OpportunityCaptionPuzzle onComplete={() => setPhase(2)} />}
  </main>;
}

function Game() {
  const [initial] = useState(readSave);
  const [save, dispatch] = useReducer(gameReducer, initial.save);
  const [invalid, setInvalid] = useState(initial.invalid);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { if (!invalid) writeSave(save); }, [save, invalid]);
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname, save.currentSceneId]);
  useEffect(() => {
    document.title = location.pathname === '/story'
      ? `${scenes[save.currentSceneId].title} · ECHOES` : 'ECHOES — The Last Archive';
  }, [location.pathname, save.currentSceneId]);
  useEffect(() => {
    if (!save.settings.audioEnabled || typeof AudioContext === 'undefined') return;
    let context: AudioContext;
    try { context = new AudioContext(); } catch { return; }
    const gain = context.createGain();
    gain.gain.value = .019;
    gain.connect(context.destination);
    [48, 72, 96].forEach((frequency, index) => {
      const tone = context.createOscillator();
      const voice = context.createGain();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      voice.gain.value = 1 / (index + 1);
      tone.connect(voice).connect(gain);
      tone.start();
    });
    void context.resume().catch(() => {});
    return () => { void context.close().catch(() => {}); };
  }, [save.settings.audioEnabled]);
  function begin() {
    dispatch({ type: 'replay' });
    dispatch({ type: 'next' });
    setInvalid(false);
    navigate('/story');
  }
  return <div className={`app ${save.settings.reduceMotion ? 'reduce-motion' : ''}`}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand" aria-label="ECHOES home"><span className="brand-icon"><Orbit size={23} /></span><span>ECHOES<span className="brand-sub">The Last Archive</span></span></Link>
        <nav aria-label="Main navigation">
          <NavLink to={save.currentSceneId === 'E00' ? '/' : '/story'} end><span className="nav-long">The </span>Journey</NavLink>
          <NavLink to="/archive">Archive</NavLink>
          <NavLink to="/sources">Sources</NavLink>
        </nav>
        <button className="settings-button" aria-label={settingsOpen ? 'Close settings' : 'Open settings'} aria-expanded={settingsOpen} onClick={() => setSettingsOpen(value => !value)}>{settingsOpen ? <X size={20} /> : <Settings2 size={20} />}</button>
        {settingsOpen && <section className="settings-popover panel" aria-label="Game settings">
          <h2>Settings</h2>
          <label>{save.settings.audioEnabled ? <AudioLines size={17} /> : <VolumeX size={17} />} <span>Ambient sound</span>
            <input type="checkbox" checked={save.settings.audioEnabled} onChange={event => dispatch({ type: 'settings', value: { audioEnabled: event.target.checked } })} /></label>
          <label><span>Reduce motion</span><input type="checkbox" checked={save.settings.reduceMotion} onChange={event => dispatch({ type: 'settings', value: { reduceMotion: event.target.checked } })} /></label>
          <label><span>Caption styling</span><input type="checkbox" checked={save.settings.captionsEnabled} onChange={event => dispatch({ type: 'settings', value: { captionsEnabled: event.target.checked } })} /></label>
          <small>Dialogue is always readable on screen.</small>
        </section>}
      </div>
    </header>
    {invalid && <div className="save-notice shell" role="alert"><p>The saved mission could not be read. You can reset it and start at Earth orbit.</p><button className="button secondary" onClick={() => setInvalid(false)}>Reset saved mission</button></div>}
    <Routes>
      <Route path="/" element={<Home save={save} begin={begin} />} />
      <Route path="/story" element={<StoryPage save={save} dispatch={dispatch} />} />
      <Route path="/archive" element={<ArchivePage restored={save.restoredArtifacts} />} />
      <Route path="/archive/:id" element={<ArtifactDetail restored={save.restoredArtifacts} />} />
      <Route path="/archive/:id/replay" element={<ReplayPuzzle />} />
      <Route path="/sources" element={<SourcesPage />} />
      <Route path="*" element={<main id="main" className="shell interior"><h1>Page unavailable</h1><Link to="/" className="button secondary">Return to Earth orbit</Link></main>} />
    </Routes>
    <footer className="site-footer"><div className="shell row between"><span><BookOpen size={15} /> ECHOES · The Last Archive</span><Link to="/sources">Sources &amp; credits</Link></div></footer>
  </div>;
}
export default function App() {
  return <BrowserRouter><Game /></BrowserRouter>;
}

