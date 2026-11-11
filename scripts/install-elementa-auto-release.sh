#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Private, stable control files; ordinary website artifacts never execute code.
release_home="${HOME}/.local/share/elementa-auto-release"
plist_path="${HOME}/Library/LaunchAgents/org.smolkapps.elementa-auto-release.plist"
mkdir -p "$release_home" "${HOME}/Library/LaunchAgents"
chmod 700 "$release_home"
for file in auto-release-elementa.mjs publish-elementa.mjs release-manifest.mjs promote-elementa.py; do
  cp "scripts/$file" "$release_home/$file"
  chmod 600 "$release_home/$file"
done
python3 - "$release_home" "$plist_path" <<'PY'
import plistlib, sys
from pathlib import Path
directory, target = Path(sys.argv[1]), Path(sys.argv[2])
with target.open('wb') as stream:
    plistlib.dump({
        'Label': 'org.smolkapps.elementa-auto-release',
        'ProgramArguments': ['/opt/homebrew/bin/node', str(directory / 'auto-release-elementa.mjs')],
        'StartInterval': 180,
        'RunAtLoad': True,
        'ProcessType': 'Background',
        'EnvironmentVariables': {'PATH': '/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin'},
        'StandardOutPath': str(directory / 'release.log'),
        'StandardErrorPath': str(directory / 'release.log'),
    }, stream)
target.chmod(0o600)
PY
launchctl bootout "gui/$(id -u)/org.smolkapps.elementa-auto-release" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$plist_path"
launchctl print "gui/$(id -u)/org.smolkapps.elementa-auto-release"
