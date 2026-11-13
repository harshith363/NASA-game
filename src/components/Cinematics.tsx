import { assets } from '../content/assets';
import { Media } from './Media';

export function CinematicStage({ assetId, animate = true, className = '' }: { assetId: string; animate?: boolean; className?: string }) {
  const asset = assets[assetId];
  return <div className={`cinematic ${animate ? 'cinematic-motion' : ''} ${className}`}>
    <Media id={assetId} eager caption={false} />
    <div className="cinematic-shade" aria-hidden="true" />
    <div className="cinematic-credit">
      {asset.authenticityLabel} <span>· {asset.credit}</span>
      {asset.sourceUrl && <a href={asset.sourceUrl} target="_blank" rel="noreferrer">Original ↗</a>}
    </div>
  </div>;
}

export function RouteMotion({ mars }: { mars: boolean }) {
  return <div className="route-motion" aria-label={mars ? 'Months later. Schematic journey to Mars.' : 'Schematic lunar flyby.'} role="img">
    <p className="eyebrow">{mars ? 'Months later' : 'Lunar flyby'}</p>
    <svg viewBox="0 0 360 85" aria-hidden="true">
      <path d="M27 60Q135-28 330 41" stroke="#566778" strokeDasharray="3 6" fill="none" />
      <path className="route-trace" pathLength="1" d="M27 60Q135-28 330 41" stroke="#e7b66b" strokeWidth="2" fill="none" />
      <circle cx="27" cy="60" r="7" fill={mars ? '#ccc2b1' : '#75bbdb'} />
      <circle cx="330" cy="41" r="10" fill={mars ? '#bc674c' : '#ccc2b1'} />
    </svg>
    <small>{mars ? 'Moon vicinity → Mars' : 'Earth orbit → Moon vicinity'} · Schematic</small>
  </div>;
}

export function SignalFade() {
  return <div className="signal-fade">
    <div className="dust-interpretation" aria-hidden="true" />
    <svg viewBox="0 0 250 30" aria-hidden="true">
      <path d="M0 15h28l5-7 5 15 7-19 8 24 7-13h20l4-5 6 11 6-6h25l3-3 5 6 4-3h117" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
    <small>Dust and signal fade · Fictional visualization</small>
  </div>;
}
