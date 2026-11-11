import { createHash } from 'node:crypto';
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REPOSITORY = 'smolkapps/periodic-table-seo-element-pages';
export const ORIGIN = 'https://elementalearn.com';
export const REQUIRED = ['index.html', 'element/oxygen/index.html', 'element/sulfur/index.html',
  'study/index.html', 'study/sw.js', 'study/manifest.json', 'site.webmanifest',
  'favicon.svg', 'og-default.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'study/icons/apple-touch-icon-180.png', 'study/icons/icon-192.png', 'study/icons/icon-512.png',
  'study/icons/icon-512-maskable.png',
  'robots.txt', 'sitemap-index.xml', '404.html'];

export function releaseIdentity(revision, runId) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Release needs a full Git revision');
  if (runId !== 'manual' && !/^[1-9][0-9]*$/.test(String(runId))) throw new Error('Invalid CI run ID');
  return { repository: REPOSITORY, origin: ORIGIN, source_revision: revision, ci_run_id: String(runId) };
}

export async function inventory(directory, prefix = '') {
  const files = {};
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) throw new Error(`Unsafe release entry: ${path}`);
    if (entry.isDirectory()) Object.assign(files, await inventory(directory, path + '/'));
    else if (entry.isFile() && path !== 'release.json') {
      files[path] = createHash('sha256').update(await readFile(join(directory, path))).digest('hex');
    } else if (!entry.isFile()) throw new Error(`Unsupported release entry: ${path}`);
  }
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
}

export async function writeManifest(directory, revision, runId) {
  const identity = releaseIdentity(revision, runId);
  const files = await inventory(directory);
  for (const path of REQUIRED) if (!files[path]) throw new Error(`Incomplete site: ${path}`);
  const manifest = { ...identity, files };
  await writeFile(join(directory, 'release.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

export async function verifyManifest(directory, revision, runId) {
  if (!(await lstat(directory)).isDirectory()) throw new Error('Release root is not a directory');
  const expected = releaseIdentity(revision, runId);
  const manifest = JSON.parse(await readFile(join(directory, 'release.json'), 'utf8'));
  for (const [key, value] of Object.entries(expected)) {
    if (manifest[key] !== value) throw new Error(`Release identity mismatch: ${key}`);
  }
  const files = await inventory(directory);
  if (JSON.stringify(files) !== JSON.stringify(manifest.files)) throw new Error('Release file inventory/checksum mismatch');
  for (const path of REQUIRED) if (!files[path]) throw new Error(`Incomplete site: ${path}`);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [action, directory, revision, runId] = process.argv.slice(2);
  if (action === 'create') await writeManifest(directory, revision, runId);
  else if (action === 'verify') await verifyManifest(directory, revision, runId);
  else throw new Error('Usage: release-manifest.mjs create|verify DIRECTORY REVISION RUN_ID');
}
