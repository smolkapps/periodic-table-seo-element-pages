import { describe, it, expect } from 'vitest';
import { runInNewContext } from 'node:vm';
import { scopeManifest, serviceWorker } from '../scripts/assemble-study.mjs';

describe('study app deployed alongside the reference site', () => {
  it('keeps installation, icons and shortcuts inside the study app', () => {
    const result = scopeManifest({ icons: [{ src: '/icons/icon-192.png' }], shortcuts: [{ url: '/practice' }] });
    const base = 'https://elementalearn.com/study/manifest.json';
    expect(new URL(result.start_url, base).href).toBe('https://elementalearn.com/study/#/');
    expect(new URL(result.scope, base).pathname).toBe('/study/');
    expect(new URL(result.icons[0].src, base).pathname).toBe('/study/icons/icon-192.png');
    expect(new URL(result.shortcuts[0].url, base).href).toBe('https://elementalearn.com/study/#/practice');
    const repeated = scopeManifest(result);
    expect(repeated).toEqual(result);
  });

  it('updates its own offline cache without deleting another product’s data', async () => {
    const handlers: Record<string, Function> = {};
    const deleted: string[] = [];
    let pending: Promise<unknown> | undefined;
    runInNewContext(serviceWorker(['index.html', 'assets/app.js'], 'new'), {
      URL,
      self: { registration: { scope: 'https://elementalearn.com/study/' }, addEventListener: (type: string, handler: Function) => handlers[type] = handler, clients: { claim: () => {} } },
      caches: { keys: async () => ['elementa-study-old', 'elementa-study-new', 'another-app-v1'], delete: async (key: string) => deleted.push(key) },
    });
    handlers.activate({ waitUntil: (promise: Promise<unknown>) => pending = promise });
    await pending;
    expect(deleted).toEqual(['elementa-study-old']);
  });

  it('serves the complete app shell offline and leaves reference articles alone', async () => {
    const handlers: Record<string, Function> = {};
    const lookedUp: string[] = [];
    let response: Promise<unknown> | undefined;
    runInNewContext(serviceWorker(['index.html', 'assets/app.js'], 'new'), {
      URL,
      self: { registration: { scope: 'https://elementalearn.com/study/' }, addEventListener: (type: string, handler: Function) => handlers[type] = handler },
      fetch: async () => { throw new Error('offline'); },
      caches: { match: async (key: string) => { lookedUp.push(key); return 'study shell'; } },
    });
    const event = (url: string) => ({ request: { method: 'GET', mode: 'navigate', url }, respondWith: (promise: Promise<unknown>) => response = promise });
    handlers.fetch(event('https://elementalearn.com/element/oxygen/'));
    expect(response).toBeUndefined();
    handlers.fetch(event('https://elementalearn.com/study/'));
    expect(await response).toBe('study shell');
    expect(lookedUp).toEqual(['https://elementalearn.com/study/index.html']);
  });
});
