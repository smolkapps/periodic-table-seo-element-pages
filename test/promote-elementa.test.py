"""Disposable filesystem tests; never touches the production webroot."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('promotion', Path(__file__).resolve().parents[1] / 'scripts/promote-elementa.py')
promotion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(promotion)


class PromotionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='elementa-promote-test-')
        self.root = Path(self.temp.name)
        promotion.ROOT = self.root
        promotion.LIVE = self.root / 'html'
        promotion.BACKUPS = self.root / 'backups'
        promotion.BACKUPS.mkdir()
        promotion.LIVE.mkdir()
        (promotion.LIVE / 'index.html').write_text('prior website')
        (promotion.LIVE / 'old-page.html').write_text('removed page')
        (promotion.LIVE / 'study/assets').mkdir(parents=True)
        (promotion.LIVE / 'study/assets/old-hash.js').write_text('cached old bundle')
        self.stage = self.root / ('.release-' + '1' * 24)
        self.stage.mkdir()
        self.revision = 'a' * 40
        names = ['index.html', 'study/index.html', 'element/oxygen/index.html', 'study/sw.js',
                 'study/manifest.json', 'site.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
                 'study/icons/apple-touch-icon-180.png', 'study/icons/icon-192.png',
                 'study/icons/icon-512.png', 'study/icons/icon-512-maskable.png', 'study/assets/new-hash.js']
        self.files = {}
        for name in names:
            path = self.stage / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('<title>New website</title>' if name.endswith('.html') else name)
            self.files[name] = hashlib.sha256(path.read_bytes()).hexdigest()
        (self.stage / 'release.json').write_text(json.dumps({
            'repository': 'smolkapps/periodic-table-seo-element-pages', 'origin': promotion.ORIGIN,
            'source_revision': self.revision, 'ci_run_id': '123', 'files': self.files,
        }))
        self.argv = patch.object(promotion.sys, 'argv', ['promote', str(self.stage), self.revision, '123'])
        self.argv.start()
        self.owner = patch.object(promotion.pwd, 'getpwnam', return_value=types.SimpleNamespace(pw_uid=os.getuid(), pw_gid=os.getgid()))
        self.owner.start()
        self.network = patch.object(promotion, 'fetch', side_effect=self.fetch)
        self.network.start()
        if not hasattr(promotion.ctypes.CDLL(None), 'renameat2'):
            # macOS validates behavior; the same suite on ctdsu uses the real
            # Linux renameat2 exchange rather than this portable fixture swap.
            self.exchange = patch.object(promotion, 'exchange', side_effect=self.portable_exchange)
            self.exchange.start()
        else:
            self.exchange = None

    def tearDown(self):
        if self.exchange:
            self.exchange.stop()
        self.network.stop()
        self.owner.stop()
        self.argv.stop()
        self.temp.cleanup()

    def portable_exchange(self, first, second):
        temporary = self.root / 'exchange-fixture'
        first.rename(temporary)
        second.rename(first)
        temporary.rename(second)

    def fetch(self, name):
        path = name.split('?', 1)[0].lstrip('/') or 'index.html'
        if path.endswith('/'):
            path += 'index.html'
        mime = 'image/png' if path.endswith('.png') else 'application/manifest+json' if path.endswith('.webmanifest') else 'text/html'
        return (promotion.LIVE / path).read_bytes(), mime

    def execute(self):
        with contextlib.redirect_stdout(io.StringIO()) as output:
            promotion.main()
        return json.loads(output.getvalue())

    def test_success_preserves_cached_bundles_but_not_removed_pages(self):
        result = self.execute()
        self.assertEqual(result['status'], 'published')
        self.assertEqual((promotion.LIVE / 'study/assets/old-hash.js').read_text(), 'cached old bundle')
        self.assertFalse((promotion.LIVE / 'old-page.html').exists())
        self.assertEqual((Path(result['backup']) / 'index.html').read_text(), 'prior website')

    def test_public_failure_restores_prior_site_and_preserves_rollback(self):
        with patch.object(promotion, 'fetch', side_effect=RuntimeError('public fixture failure')):
            with self.assertRaisesRegex(RuntimeError, 'public fixture failure'):
                self.execute()
        self.assertEqual((promotion.LIVE / 'index.html').read_text(), 'prior website')
        self.assertEqual((self.stage / 'index.html').read_text(), '<title>New website</title>')
        self.assertEqual(list(promotion.BACKUPS.iterdir()), [])

    def test_corrupt_artifact_does_not_replace_current_site(self):
        (self.stage / 'study/sw.js').write_text('wrong bytes')
        with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
            self.execute()
        self.assertEqual((promotion.LIVE / 'index.html').read_text(), 'prior website')

    def test_failed_rollback_keeps_recovery_directory(self):
        real_exchange = promotion.exchange
        calls = []
        def fail_second(first, second):
            calls.append(1)
            if len(calls) == 2:
                raise OSError('fixture rollback failure')
            return real_exchange(first, second)
        with patch.object(promotion, 'exchange', side_effect=fail_second), patch.object(promotion, 'fetch', side_effect=RuntimeError('public fixture failure')):
            with self.assertRaisesRegex(OSError, 'rollback failure'):
                self.execute()
        self.assertTrue((self.stage / '.keep-rollback').exists())
        self.assertEqual((self.stage / 'index.html').read_text(), 'prior website')

    def test_rotates_only_new_auto_release_snapshots(self):
        historical = promotion.BACKUPS / 'elementa-20261101T050411Z'
        historical.mkdir()
        for day in range(1, 6):
            (promotion.BACKUPS / f'elementa-auto-2026010{day}T000000Z-bbbbbbbbbbbb').mkdir()
        self.execute()
        self.assertTrue(historical.exists())
        self.assertEqual(len(list(promotion.BACKUPS.glob('elementa-auto-*'))), 3)

    def test_low_disk_preserves_current_site(self):
        with patch.object(promotion.shutil, 'disk_usage', return_value=types.SimpleNamespace(free=100)):
            with self.assertRaisesRegex(RuntimeError, '500 MiB'):
                self.execute()
        self.assertEqual((promotion.LIVE / 'index.html').read_text(), 'prior website')

    def test_backup_maintenance_error_does_not_misreport_healthy_publication(self):
        with patch.object(promotion.shutil, 'move', side_effect=OSError('backup fixture failure')):
            result = self.execute()
        self.assertEqual(result['status'], 'published')
        self.assertTrue(result['warnings'])
        self.assertEqual(Path(result['backup']), self.stage)
        self.assertEqual((self.stage / 'index.html').read_text(), 'prior website')
        self.assertEqual((promotion.LIVE / 'index.html').read_text(), '<title>New website</title>')


if __name__ == '__main__':
    unittest.main()
