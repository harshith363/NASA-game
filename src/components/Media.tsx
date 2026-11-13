import { useState } from 'react';
import { ImageOff, ArrowUpRight } from 'lucide-react';
import { assets } from '../content/assets';
import { references } from '../content/references';

export function Media({ id, className = '', eager = false, caption = true }: {
  id: string; className?: string; eager?: boolean; caption?: boolean;
}) {
  return <MediaFrame key={id} id={id} className={className} eager={eager} caption={caption} />;
}
function MediaFrame({ id, className, eager, caption }: { id: string; className: string; eager: boolean; caption: boolean }) {
  const asset = assets[id];
  const [failed, setFailed] = useState(false);
  const available = asset?.status === 'approved' && !failed;
  return (
    <figure className={`media ${className}`}>
      {available ? <img src={asset.localPath} alt={asset.alt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} /> :
        <div className="media-fallback"><ImageOff size={22} aria-hidden="true" /><span>{asset?.title ?? 'Archive image'}</span><small>Image unavailable</small></div>}
      {caption && asset && <figcaption>
        <span>{asset.authenticityLabel} · {asset.credit}</span>
        {asset.sourceUrl && <a href={asset.sourceUrl} target="_blank" rel="noreferrer">Original <ArrowUpRight size={13} /></a>}
      </figcaption>}
    </figure>
  );
}

export function SourceLinks({ ids }: { ids: readonly string[] }) {
  return <ul className="source-links">{ids.map(id => {
    const source = references[id as keyof typeof references];
    return source && <li key={id}><a href={source[1]} target="_blank" rel="noreferrer"><span>{source[0]}</span><ArrowUpRight size={15} aria-hidden="true" /></a></li>;
  })}</ul>;
}

export function SourcesDrawer({ ids, media = [] }: { ids: readonly string[]; media?: string[] }) {
  return <details className="sources-drawer"><summary>Sources and image credits</summary>
    <SourceLinks ids={ids} />
    {media.map(id => assets[id] && <p key={id} className="muted">{assets[id].title} · {assets[id].credit} {assets[id].sourceUrl && <a href={assets[id].sourceUrl} target="_blank" rel="noreferrer">Original image record</a>}</p>)}
  </details>;
}
