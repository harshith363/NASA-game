import { copyFile, mkdir } from 'node:fs/promises';

const root = new URL('../dist/', import.meta.url);
const routes = [
  'story', 'archive', 'archive/apollo-11-descent-stage', 'archive/opportunity',
  'archive/apollo-11-descent-stage/replay', 'archive/opportunity/replay', 'sources',
];

await Promise.all(routes.map(async route => {
  const destination = new URL(route + '/', root);
  await mkdir(destination, { recursive: true });
  await copyFile(new URL('index.html', root), new URL('index.html', destination));
}));
await copyFile(new URL('index.html', root), new URL('404.html', root));
