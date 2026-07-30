import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../../../src/lib/logger.js';
import { OpenLibraryProvider } from '../../../src/services/suggestion-providers/open-library.provider.js';

function buildLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger;
}

describe('OpenLibraryProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs the call and the resolved metadata on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [{ title: 'Dune', first_publish_year: 1965, author_name: ['Frank Herbert'] }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenLibraryProvider(1000);
    const logger = buildLogger();

    const result = await provider.search('dune', logger);

    expect(result?.title).toBe('Dune');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ provider: 'open-library', query: 'dune' }), expect.any(String));
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dune', year: 1965 }), expect.any(String));
  });

  it('logs a warning and returns null when the response fails schema validation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ unexpected: true }) });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenLibraryProvider(1000);
    const logger = buildLogger();

    const result = await provider.search('dune', logger);

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ provider: 'open-library' }), expect.any(String));
  });
});
