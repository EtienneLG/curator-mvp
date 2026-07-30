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

  it('logs the call and the resolved metadata (including description) on success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [{ key: '/works/OL45804W', title: 'Dune', first_publish_year: 1965, author_name: ['Frank Herbert'] }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ description: { value: 'A desert planet epic.' } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenLibraryProvider(1000);
    const logger = buildLogger();

    const result = await provider.search('dune', logger);

    expect(result?.title).toBe('Dune');
    expect(result?.description).toBe('A desert planet epic.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://openlibrary.org/works/OL45804W.json');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ provider: 'open-library', query: 'dune' }), expect.any(String));
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dune', year: 1965 }), expect.any(String));
  });

  it('returns title/year/creator with a null description when the work has no key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [{ title: 'Dune', first_publish_year: 1965, author_name: ['Frank Herbert'] }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenLibraryProvider(1000);
    const logger = buildLogger();

    const result = await provider.search('dune', logger);

    expect(result?.title).toBe('Dune');
    expect(result?.description).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns title/year/creator with a null description when the work lookup fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [{ key: '/works/OL45804W', title: 'Dune', first_publish_year: 1965, author_name: ['Frank Herbert'] }],
        }),
      })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenLibraryProvider(1000);
    const logger = buildLogger();

    const result = await provider.search('dune', logger);

    expect(result?.title).toBe('Dune');
    expect(result?.description).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }), expect.any(String));
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
