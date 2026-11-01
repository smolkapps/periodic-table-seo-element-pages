import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function scopeManifest(manifest) {
  return {
    ...manifest,
    id: './', start_url: './#/', scope: './',
    icons: manifest.icons.map(icon => ({ ...icon, src: './' + icon.src.replace(/^\.?\//, '') })),
    shortcuts: (manifest.shortcuts || []).map(shortcut => ({ ...shortcut, url: './#/' + shortcut.url.replace(/^\.\//, '').replace(/^\/?#?\/?/, '') })),
  };
}

export function serviceWorker(files, version) {
  return `const CACHE_PREFIX = 'elementa-study-';
const CACHE_NAME = CACHE_PREFIX + ${JSON.stringify(version)};
const SCOPE = new URL(self.registration.scope);
const SHELL = new URL('index.html', SCOPE).href;
const ASSETS = ${JSON.stringify(files)}.map(path => new URL(path, SCOPE).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(SHELL)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
`;
}

async function filesIn(dir, prefix = '') {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await filesIn(join(dir, entry.name), path + '/'));
    else files.push(path);
  }
  return files.sort();
}

export async function assemble(root = process.cwd()) {
  const source = join(root, 'companion/dist');
  const destination = join(root, 'dist/study');
  await readFile(join(source, 'index.html'));
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true });
  let html = await readFile(join(destination, 'index.html'), 'utf8');
  html = html.replace(/href="\/(favicon\.svg|icons\/[^"\s]+|manifest\.json)"/g, 'href="/study/$1"');
  html = html.replace(/rel="canonical" href="https:\/\/elementalearn\.com\/"/, 'rel="canonical" href="https://elementalearn.com/study/"');
  html = html.replace(/<meta\s+(?:property|name)="(?:og:url|og:image|twitter:image)"[^>]*>/g, '');
  html = html.replace('</head>', '<meta property="og:url" content="https://elementalearn.com/study/" /><meta property="og:image" content="https://elementalearn.com/og-default.png" /><meta name="twitter:image" content="https://elementalearn.com/og-default.png" /></head>');
  await writeFile(join(destination, 'index.html'), html);
  const manifest = scopeManifest(JSON.parse(await readFile(join(destination, 'manifest.json'), 'utf8')));
  await writeFile(join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const files = (await filesIn(destination)).filter(path => path !== 'sw.js');
  const hash = createHash('sha256');
  for (const path of files) hash.update(await readFile(join(destination, path)));
  const version = hash.digest('hex').slice(0, 16);
  await writeFile(join(destination, 'sw.js'), serviceWorker(files, version));
  console.log(`Assembled complete study app: ${files.length} offline assets, version ${version}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await assemble();
