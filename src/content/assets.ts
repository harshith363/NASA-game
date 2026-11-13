import { references, type SourceId } from './references';

export type AssetRecord = {
  id: string;
  localPath: string;
  kind: 'nasa-photo' | 'fictional-ai-art' | 'original-diagram' | 'animation';
  title: string;
  alt: string;
  credit: string;
  sourceUrl?: string;
  usageReviewed: boolean;
  authenticityLabel: string;
  status: 'approved' | 'pending' | 'placeholder';
};
function art(id: string, file: string, title: string, alt: string): AssetRecord {
  return {
    id, localPath: '/assets/art/odyssey-' + file + '.webp', kind: 'fictional-ai-art',
    title, alt, credit: 'OpenAI ImageGen · artwork for ECHOES', usageReviewed: true,
    authenticityLabel: 'Fictional illustration', status: 'approved',
  };
}
function nasa(id: string, file: string, source: SourceId, alt: string, credit: string): AssetRecord {
  return {
    id, localPath: '/assets/nasa/' + file + '.jpg', kind: 'nasa-photo',
    title: references[source][0], alt, credit, sourceUrl: references[source][1],
    usageReviewed: true, authenticityLabel: 'NASA archival image', status: 'approved',
  };
}
export const assets: Record<string, AssetRecord> = Object.fromEntries([
  art('earth', 'earth-departure', 'Departure from Earth', 'Fictional Odyssey spacecraft above the blue arc of Earth.'),
  art('deck', 'observation-deck', 'Odyssey observation deck', 'Four students watch Earth through the fictional ship’s panoramic windows.'),
  art('flyby', 'lunar-flyby', 'Odyssey lunar flyby', 'Fictional Odyssey spacecraft passing the cratered lunar limb.'),
  art('arrival', 'mars-arrival', 'Odyssey approaches Mars', 'Fictional Odyssey spacecraft approaches the copper-colored rim of Mars.'),
  art('window', 'mars-window', 'Mars from Odyssey', 'Four students look out at Mars from the fictional observation deck.'),
  ...['Ari', 'Maya', 'Leo', 'Sam'].map((student): AssetRecord => ({
    id: student.toLowerCase(), localPath: '/assets/art/student-' + student.toLowerCase() + '.webp',
    kind: 'fictional-ai-art', title: student + ' portrait', alt: 'Fictional portrait of ' + student + '.',
    credit: 'OpenAI ImageGen · artwork for ECHOES', usageReviewed: true,
    authenticityLabel: 'Fictional illustration', status: 'approved',
  })),
  {
    id: 'echo', localPath: '/assets/art/echo-avatar.svg', kind: 'original-diagram',
    title: 'ECHO avatar', alt: 'Illustrated amber waveform inside a ring.',
    credit: 'ECHOES', usageReviewed: true, authenticityLabel: 'Fictional illustration', status: 'approved',
  } satisfies AssetRecord,
  nasa('apollo', 'apollo11-landing-site', 'N2', 'LRO orbital photograph of Tranquility Base showing the descent stage and trails.', 'NASA/GSFC/Arizona State University'),
  nasa('hardware', 'apollo11-hardware-context', 'EAGLE', 'The lunar module Eagle in landing configuration, photographed from Columbia.', 'NASA'),
  nasa('rover', 'opportunity-rover', 'SELFIE', 'Opportunity’s soft-focus self-portrait at Perseverance Valley, assembled from rover camera images.', 'NASA/JPL-Caltech'),
  nasa('eagle-crater', 'opportunity-eagle-crater', 'CRATER', 'Opportunity’s panorama of Eagle Crater and the surrounding plain.', 'NASA/JPL/Cornell'),
  nasa('rock', 'opportunity-evidence-rock', 'ROCK', 'Layered El Capitan rocks and two circular holes made by the rover’s rock abrasion tool.', 'NASA/JPL'),
  nasa('traverse', 'opportunity-traverse', 'N7', 'NASA map marking Opportunity’s full traverse from Eagle Crater to Perseverance Valley.', 'NASA/JPL-Caltech/MSSS'),
  nasa('shadow', 'opportunity-shadow', 'SHADOW', 'Opportunity’s shadow cast on the floor of Endurance Crater in July 2004.', 'NASA/JPL-Caltech'),
  nasa('last-image', 'opportunity-last-image', 'N6', 'Dark incomplete Pancam image with camera noise and black pixels where the transmission stopped.', 'NASA/JPL-Caltech/Cornell/ASU'),
].map(asset => [asset.id, asset]));
