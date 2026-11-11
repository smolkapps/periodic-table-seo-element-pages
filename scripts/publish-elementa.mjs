import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyManifest } from './release-manifest.mjs';

const ssh = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', 'ctdsu.com'];
const command = (program, args, options = {}) => execFileSync(program, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], ...options });

export async function publish(directory, revision, runId, beforePromote = async () => {}) {
  await verifyManifest(directory, revision, runId);
  const stage = `/var/www/elementalearn.com/.release-${randomBytes(12).toString('hex')}`;
  const remoteScript = await readFile(new URL('./promote-elementa.py', import.meta.url), 'utf8');
  command('ssh', [...ssh, `mkdir -m 755 '${stage}'`]);
  let promoted = false;
  try {
    command('rsync', ['-az', '--delay-updates', resolve(directory) + '/', `ctdsu.com:${stage}/`]);
    // A slow transfer must not promote a build superseded while it was uploading.
    await beforePromote();
    const result = command('ssh', [...ssh, `python3 - '${stage}' '${revision}' '${runId}'`], { input: remoteScript });
    promoted = true;
    process.stdout.write(result);
    return JSON.parse(result);
  } finally {
    if (!promoted) {
      // Only the unique task-owned stage can be removed. A successful exchange
      // retains the old site as a backup in the remote helper before returning.
      const cleanup = `import json,shutil\nfrom pathlib import Path\np=Path('${stage}')\nlive=Path('/var/www/elementalearn.com/html/release.json')\nm=json.loads(live.read_text()) if live.exists() else {}\nif p.exists() and not (p/'.keep-rollback').exists() and m.get('source_revision')!='${revision}': shutil.rmtree(p)\n`;
      try { command('ssh', [...ssh, 'python3 -'], { input: cleanup }); }
      catch (error) { console.error(`Could not clean release stage ${stage}: ${error.message}`); }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [directory, revision, runId] = process.argv.slice(2);
  await publish(directory, revision, runId);
}
