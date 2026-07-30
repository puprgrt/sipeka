import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocument } from './docsService';

const originalFetch = globalThis.fetch;

test('createDocument falls back locally without calling Google Docs for an invalid token', async () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    },
    configurable: true
  });

  let fetchCalled = false;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    return {
      ok: false,
      status: 401,
      text: async () => 'Unauthorized'
    } as Response;
  }) as typeof fetch;

  const result = await (createDocument as any)('Test Document', 'Hello', 'invalid-token');

  assert.equal(fetchCalled, false);
  assert.match(result, /^data:text\/plain/);

  globalThis.fetch = originalFetch;
});
