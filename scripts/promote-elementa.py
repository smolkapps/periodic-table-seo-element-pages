#!/usr/bin/env python3
"""Promote one validated Elementa artifact; no shared Caddy or DNS changes."""
import ctypes
import datetime
import fcntl
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import sys
import urllib.request

ROOT = Path('/var/www/elementalearn.com')
LIVE = ROOT / 'html'
BACKUPS = Path('/var/backups')
ORIGIN = 'https://elementalearn.com'
UA = 'Mozilla/5.0 (Elementa release verification)'


def exchange(first, second):
    libc = ctypes.CDLL(None, use_errno=True)
    if libc.renameat2(-100, os.fsencode(first), -100, os.fsencode(second), 2):
        raise OSError(ctypes.get_errno(), 'Atomic release exchange failed')


def fetch(path):
    request = urllib.request.Request(ORIGIN + path, headers={'User-Agent': UA, 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=25) as response:
        if response.status != 200:
            raise RuntimeError('Public release check failed: ' + path)
        return response.read(), response.headers.get_content_type()


def main():
    stage, revision, run_id = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
    if stage.parent != ROOT or not re.fullmatch(r'\.release-[0-9a-f]{24}', stage.name):
        raise ValueError('Invalid release stage')
    if not re.fullmatch(r'[0-9a-f]{40}', revision) or not re.fullmatch(r'(manual|[1-9][0-9]*)', run_id):
        raise ValueError('Invalid release identity')
    with (ROOT / '.publish.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        manifest = json.loads((stage / 'release.json').read_text())
        if (manifest.get('repository'), manifest.get('origin'), manifest.get('source_revision'), manifest.get('ci_run_id')) != (
                'smolkapps/periodic-table-seo-element-pages', ORIGIN, revision, run_id):
            raise ValueError('Artifact identity mismatch')
        for name, digest in manifest['files'].items():
            path = Path(name)
            if path.is_absolute() or '..' in path.parts or any(part.startswith('.') for part in path.parts):
                raise ValueError('Unsafe artifact path')
            candidate = stage / path
            if candidate.is_symlink() or not candidate.is_file() or hashlib.sha256(candidate.read_bytes()).hexdigest() != digest:
                raise ValueError('Artifact checksum mismatch: ' + name)
        if shutil.disk_usage(ROOT).free < 500 * 1024 * 1024:
            raise RuntimeError('Less than 500 MiB free; current website retained')
        current_manifest = LIVE / 'release.json'
        if current_manifest.exists() and json.loads(current_manifest.read_text()).get('source_revision') == revision:
            shutil.rmtree(stage)
            print(json.dumps({'status': 'unchanged', 'source_revision': revision, 'ci_run_id': run_id}))
            return
        # Keep cached pages usable without retaining removed HTML pages forever.
        for assets in ['_astro', 'study/assets']:
            old = LIVE / assets
            if old.exists():
                target = stage / assets
                target.mkdir(parents=True, exist_ok=True)
                for source in old.iterdir():
                    if source.is_file() and not source.is_symlink() and not (target / source.name).exists():
                        shutil.copy2(source, target / source.name)
        owner = pwd.getpwnam('caddy')
        for path in [stage, *stage.rglob('*')]:
            if path.is_symlink():
                raise ValueError('Unexpected release symlink')
            os.chown(path, owner.pw_uid, owner.pw_gid)
            os.chmod(path, 0o755 if path.is_dir() else 0o644)
        exchange(stage, LIVE)
        try:
            data, _ = fetch('/release.json?revision=' + revision)
            if json.loads(data).get('source_revision') != revision:
                raise RuntimeError('Public release identity did not update')
            for name in ['study/sw.js', 'study/manifest.json', 'site.webmanifest', 'apple-touch-icon.png',
                         'icon-192.png', 'icon-512.png', 'study/icons/apple-touch-icon-180.png',
                         'study/icons/icon-192.png', 'study/icons/icon-512.png', 'study/icons/icon-512-maskable.png',
                         *[name for name in manifest['files'] if name.startswith(('study/assets/', '_astro/'))]]:
                data, mime = fetch('/' + name + '?revision=' + revision)
                if hashlib.sha256(data).hexdigest() != manifest['files'][name]:
                    raise RuntimeError('Public asset mismatch: ' + name)
                if name.endswith('.png') and mime != 'image/png':
                    raise RuntimeError('Public icon MIME mismatch: ' + name)
                if name.endswith('.webmanifest') and mime != 'application/manifest+json':
                    raise RuntimeError('Public manifest MIME mismatch')
            for name in ['/', '/study/', '/element/oxygen/']:
                data, mime = fetch(name + '?revision=' + revision)
                if mime != 'text/html' or b'<title>' not in data:
                    raise RuntimeError('Public page check failed: ' + name)
        except Exception:
            try:
                exchange(stage, LIVE)
            except Exception:
                # The caller must preserve the rollback directory if an unusual
                # filesystem failure prevents restoring it automatically.
                (stage / '.keep-rollback').touch()
                raise
            raise
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        backup = BACKUPS / ('elementa-auto-' + stamp + '-' + revision[:12])
        warnings = []
        try:
            shutil.move(str(stage), str(backup))
        except OSError as error:
            # The public checks passed. Keep the predecessor in place and
            # report backup maintenance separately from publication status.
            backup = stage
            warnings.append('Previous website retained at ' + str(stage) + ': ' + str(error))
        # Only snapshots created by this helper are rotated; historical operator
        # backups and every other site's data remain outside this pattern.
        snapshots = sorted((path for path in BACKUPS.glob('elementa-auto-*')
                            if re.fullmatch(r'elementa-auto-\d{8}T\d{6}Z-[0-9a-f]{12}', path.name)
                            and path.is_dir() and not path.is_symlink()), reverse=True)
        for old in snapshots[3:]:
            try:
                shutil.rmtree(old)
            except OSError as error:
                warnings.append('Snapshot retention failed for ' + str(old) + ': ' + str(error))
        print(json.dumps({'status': 'published', 'source_revision': revision, 'ci_run_id': run_id, 'backup': str(backup), 'warnings': warnings}))


if __name__ == '__main__':
    main()
