import { execFileSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ORIGIN, REPOSITORY, verifyManifest } from './release-manifest.mjs';
import { publish } from './publish-elementa.mjs';

export function selectRun(revision, runs) {
  const run = runs.find(item => item.head_sha === revision && item.event === 'push' && item.head_branch === 'main');
  if (!run || run.status !== 'completed' || run.conclusion !== 'success') return null;
  if (run.repository?.full_name !== REPOSITORY || run.head_repository?.full_name !== REPOSITORY) {
    throw new Error('CI repository identity mismatch');
  }
  return run;
}

export function selectArtifact(revision, artifacts) {
  const matches = artifacts.filter(item => item.name === `elementa-site-${revision}` && !item.expired);
  if (matches.length !== 1) return null;
  return matches[0];
}

export async function assertCurrent(revision, readMain) {
  if (await readMain() !== revision) throw new Error('Main changed during release preparation; current website retained');
}

const gh = args => execFileSync('/opt/homebrew/bin/gh', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const api = path => JSON.parse(gh(['api', `repos/${REPOSITORY}/${path}`]));
const mainRevision = () => api('git/ref/heads/main').object.sha;

async function run() {
  const stateDirectory = join(homedir(), '.local/share/elementa-auto-release');
  await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
  const revision = mainRevision();
  let previous;
  try { previous = JSON.parse(await readFile(join(stateDirectory, 'state.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous?.source_revision === revision) return;
  const runs = api(`actions/workflows/ci.yml/runs?branch=main&event=push&head_sha=${revision}&per_page=10`).workflow_runs;
  const candidate = selectRun(revision, runs);
  if (!candidate) return;
  const artifact = selectArtifact(revision, api(`actions/runs/${candidate.id}/artifacts`).artifacts);
  if (!artifact) return; // Older CI runs predate release artifacts; never rebuild or guess a replacement.
  const directory = await mkdtemp(join(tmpdir(), 'elementa-release-'));
  try {
    gh(['run', 'download', String(candidate.id), '--repo', REPOSITORY, '--name', artifact.name, '--dir', directory]);
    await verifyManifest(directory, revision, String(candidate.id));
    await assertCurrent(revision, mainRevision);
    const result = await publish(directory, revision, String(candidate.id), () => assertCurrent(revision, mainRevision));
    await writeFile(join(stateDirectory, 'state.json'), JSON.stringify({ ...result, verified_at: new Date().toISOString(), origin: ORIGIN }, null, 2) + '\n', { mode: 0o600 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await run().catch(error => { console.error(new Date().toISOString(), error.message); process.exitCode = 1; });
}
