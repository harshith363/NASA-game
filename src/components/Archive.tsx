import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lock, MapPin, RotateCcw } from 'lucide-react';
import { Media, SourcesDrawer } from './Media';
import { missionIds, missions, type MissionId } from '../content/missions';

export function ArtifactCard({ id, restored, gallery = false }: { id: MissionId; restored: boolean; gallery?: boolean }) {
  const mission = missions[id];
  return <article className="artifact panel">
    <div className="artifact-heading">
      <span className="eyebrow"><MapPin size={15} /> {mission.body} · Historical record</span>
      {restored && <span className="restored"><Check size={15} /> Restored</span>}
    </div>
    <h2>{mission.name}</h2>
    <dl className="fact-grid">
      <div><dt>Location</dt><dd>{mission.locationDescription}
        {mission.coordinates && <small>{mission.coordinates.latitude}° N, {mission.coordinates.longitude}° E · {mission.coordinates.precisionNote}</small>}
      </dd></div>
      <div><dt>Landing</dt><dd>{mission.launchOrLanding}{mission.endOfMission && <small>Mission ended {mission.endOfMission}.</small>}</dd></div>
      <div><dt>Why it was sent</dt><dd>{mission.purpose}</dd></div>
      <div><dt>Why it stayed</dt><dd>{mission.leftBehindOrStoppedWhy}</dd></div>
      <div><dt>What it made possible</dt><dd>{mission.discoveriesOrLegacy.join(' ')}</dd></div>
      <div><dt>Known status</dt><dd>{mission.historicalStatus}</dd></div>
    </dl>
    {gallery && <div className="gallery">{mission.media.map(id => <Media key={id} id={id} />)}</div>}
    <SourcesDrawer ids={mission.sourceIds} media={mission.media} />
  </article>;
}

const worlds = [
  { id: 'Earth', x: 104, y: 155, r: 38, color: '#4fa2cf' },
  { id: 'Moon', x: 244, y: 110, r: 23, color: '#b8b3ab' },
  { id: 'Mars', x: 420, y: 172, r: 45, color: '#c06c4c' },
  { id: 'Beyond', x: 567, y: 103, r: 11, color: '#8d8a91' },
] as const;
type World = typeof worlds[number]['id'];
export function SolarSystemAtlas({ value, onChange, finale = false }: { value?: World; onChange?: (world: World) => void; finale?: boolean }) {
  const atlasId = useId();
  return <div className={`atlas ${finale ? 'finale' : ''}`}>
    <div className="atlas-map">
    <svg viewBox="0 0 660 252" role="img" aria-label="Stylized map linking Earth, Moon, Mars and future destinations. Not to scale.">
      <defs>{worlds.map(world => <radialGradient key={world.id} id={`${atlasId}-world-${world.id}`} cx="31%" cy="25%" r="74%">
        <stop offset="0" stopColor={world.color} /><stop offset=".58" stopColor={world.color} stopOpacity=".65" /><stop offset="1" stopColor={world.color} stopOpacity=".13" />
      </radialGradient>)}</defs>
      {Array.from({ length: 65 }, (_, index) => <circle key={index} cx={(index * 83 + 31) % 660} cy={(index * 43 + 19) % 250} r={index % 9 === 0 ? 1.4 : .65} fill="#d9e8ff" opacity={.17 + (index % 6) / 12} />)}
      <path d="M104 155 Q165 45 244 110 Q341 205 420 172 T567 103" fill="none" stroke="#5a6f84" strokeDasharray="4 7" />
      <path className="legacy-line" d="M244 110 Q341 205 420 172" fill="none" stroke="#e7b66b" strokeWidth="2" pathLength="1" />
      {worlds.map(world => <g key={world.id} transform={`translate(${world.x} ${world.y})`}>
        <circle r={world.r + 9} fill="none" stroke={value === world.id ? '#e7b66b' : '#53647b'} opacity={value === world.id ? 1 : .48} />
        <circle r={world.r} fill={`url(#${atlasId}-world-${world.id})`} stroke={world.color} strokeOpacity=".6" />
        {(world.id === 'Moon' || world.id === 'Mars') && <circle className="legacy-node" cx="3" cy="-5" r="4" fill="#ffe0a2" />}
      </g>)}
    </svg>
    {onChange && worlds.map(world =>
      <button key={world.id} className="atlas-marker" style={{ left: (world.x / 660 * 100) + '%', top: (world.y / 252 * 100) + '%' }}
        aria-pressed={value === world.id} onClick={() => onChange(world.id)}>
        <span>{world.id === 'Beyond' && <Lock size={12} />} {world.id}</span>
      </button>)}
    </div>
    <p className="map-note">Legacy constellation · Schematic, not to scale</p>
  </div>;
}

export function ArchivePage({ restored }: { restored: string[] }) {
  const [world, setWorld] = useState<World>('Moon');
  const id = world === 'Moon' ? missionIds[0] : world === 'Mars' ? missionIds[1] : null;
  return <main className="interior shell" id="main">
    <div className="page-heading"><p className="eyebrow">Odyssey / Legacy Archive</p><h1>Archive Explorer</h1>
      <p>Find the hardware, follow the evidence, and read the original NASA records.</p></div>
    <SolarSystemAtlas value={world} onChange={setWorld} />
    {id ? <>
      <div className="row between archive-selection"><h2>{world} collection</h2><Link className="button secondary" to={`/archive/${id}`}>Open full record <ArrowRight size={16} /></Link></div>
      <ArtifactCard id={id} restored={restored.includes(id)} />
    </> : <section className="panel archive-selection">
      <h2>{world === 'Earth' ? 'Earth orbit' : 'Future archive'}</h2>
      <p>{world === 'Earth' ? 'Odyssey’s fictional expedition begins here. Select Moon or Mars to investigate historical hardware.' : 'Viking, Ingenuity and Cassini are reserved for later chapters. The collection will distinguish hardware on Mars from spacecraft whose missions ended elsewhere.'}</p>
    </section>}
  </main>;
}
export function ArtifactDetail({ restored }: { restored: string[] }) {
  const { id } = useParams();
  if (!missionIds.some(mission => mission === id)) return <main id="main" className="shell interior"><h1>Record unavailable</h1><Link className="button secondary" to="/archive">Return to Archive Explorer</Link></main>;
  const mission = id as MissionId;
  return <main id="main" className="shell interior">
    <Link className="text-link" to="/archive"><ArrowLeft size={16} /> Archive Explorer</Link>
    <h1 className="page-title">{missions[mission].shortName}</h1>
    <ArtifactCard id={mission} restored={restored.includes(mission)} gallery />
    <Link className="button secondary replay-link" to={`/archive/${mission}/replay`}><RotateCcw size={16} /> Replay puzzle</Link>
  </main>;
}
