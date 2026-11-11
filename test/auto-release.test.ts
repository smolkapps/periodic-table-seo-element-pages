import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { assertCurrent, selectArtifact, selectRun } from '../scripts/auto-release-elementa.mjs';
import { REQUIRED, REPOSITORY, verifyManifest, writeManifest } from '../scripts/release-manifest.mjs';

const revision = 'a'.repeat(40);
const run = (changes = {}) => ({ id: 123, head_sha: revision, head_branch: 'main', event: 'push',
  status: 'completed', conclusion: 'success', repository: { full_name: REPOSITORY },
  head_repository: { full_name: REPOSITORY }, ...changes });

describe('automatic Elementa publication', () => {
  it('publishes only completed successful main pushes from the canonical repository', () => {
    expect(selectRun(revision, [run()])?.id).toBe(123);
    for (const changes of [{ status: 'in_progress', conclusion: null }, { conclusion: 'failure' },
      { event: 'pull_request' }, { head_branch: 'chemistry-tutor-journey' }, { head_sha: 'b'.repeat(40) }]) {
      expect(selectRun(revision, [run(changes)])).toBeNull();
    }
    expect(() => selectRun(revision, [run({ head_repository: { full_name: 'someone/fork' } })])).toThrow('repository identity');
  });

  it('does not use an earlier successful run when the latest exact-head run failed', () => {
    expect(selectRun(revision, [run({ id: 124, conclusion: 'failure' }), run()])).toBeNull();
  });

  it('requires exactly one unexpired artifact for this revision', () => {
    const artifact = { id: 44, name: `elementa-site-${revision}`, expired: false };
    expect(selectArtifact(revision, [artifact])).toEqual(artifact);
    expect(selectArtifact(revision, [])).toBeNull();
    expect(selectArtifact(revision, [{ ...artifact, expired: true }])).toBeNull();
    expect(selectArtifact(revision, [artifact, { ...artifact, id: 45 }])).toBeNull();
    expect(selectArtifact('b'.repeat(40), [artifact])).toBeNull();
  });

  it('holds a checked build superseded while being downloaded or uploaded', async () => {
    await expect(assertCurrent(revision, async () => revision)).resolves.toBeUndefined();
    await expect(assertCurrent(revision, async () => 'b'.repeat(40))).rejects.toThrow('Main changed');
  });

  it('rejects corrupt, incomplete, extra or symlinked artifacts before any publication', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'elementa-artifact-test-'));
    try {
      for (const name of REQUIRED) {
        await mkdir(dirname(join(directory, name)), { recursive: true });
        await writeFile(join(directory, name), `fixture ${name}`);
      }
      await writeManifest(directory, revision, '123');
      await expect(verifyManifest(directory, revision, '123')).resolves.toMatchObject({ source_revision: revision });
      await expect(verifyManifest(directory, 'b'.repeat(40), '123')).rejects.toThrow('identity mismatch');
      await expect(verifyManifest(directory, revision, '124')).rejects.toThrow('identity mismatch');
      await writeFile(join(directory, 'index.html'), 'corrupted');
      await expect(verifyManifest(directory, revision, '123')).rejects.toThrow('checksum mismatch');
      await writeFile(join(directory, 'index.html'), 'fixture index.html');
      await writeFile(join(directory, 'extra.js'), 'unlisted');
      await expect(verifyManifest(directory, revision, '123')).rejects.toThrow('checksum mismatch');
      await rm(join(directory, 'extra.js'));
      await rm(join(directory, 'study/sw.js'));
      await expect(verifyManifest(directory, revision, '123')).rejects.toThrow('checksum mismatch');
      await symlink(join(directory, 'index.html'), join(directory, 'study/sw.js'));
      await expect(verifyManifest(directory, revision, '123')).rejects.toThrow('Unsafe release entry');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
