import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../../../src/lib/logger.js';
import { TmdbProvider } from '../../../src/services/suggestion-providers/tmdb.provider.js';

const API_KEY = 'super-secret-tmdb-key';

function buildLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger;
}

// Collects every value passed to any logger call, so tests can assert a secret never appears
// anywhere in a log line (bindings object or message).
function loggedValues(logger: Logger) {
  const calls = [...(logger.info as ReturnType<typeof vi.fn>).mock.calls, ...(logger.warn as ReturnType<typeof vi.fn>).mock.calls];
  return calls.flat();
}

describe('TmdbProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs the call and the resolved metadata (including director) on success, without ever logging the API key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: 438631, title: 'Dune', release_date: '2021-10-22', overview: 'A desert planet epic.' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          crew: [
            { job: 'Producer', name: 'Someone Else' },
            { job: 'Director', name: 'Denis Villeneuve' },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new TmdbProvider(API_KEY, 1000);
    const logger = buildLogger();

    const result = await provider.search('dune', logger);

    expect(result?.title).toBe('Dune');
    expect(result?.creator).toBe('Denis Villeneuve');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/movie/438631/credits');
    expect(logger.info).toHaveBeenCalled();
    expect(JSON.stringify(loggedValues(logger))).not.toContain(API_KEY);
  });

  it('returns title/year/description with a null creator when the credits call fails, without ever logging the API key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: 438631, title: 'Dune', release_date: '2021-10-22', overview: 'A desert planet epic.' }],
        }),
      })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new TmdbProvider(API_KEY, 1000);
    const logger = buildLogger();

    const result = await provider.search('dune', logger);

    expect(result?.title).toBe('Dune');
    expect(result?.creator).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }), expect.any(String));
    expect(JSON.stringify(loggedValues(logger))).not.toContain(API_KEY);
  });

  it('logs a warning and returns null on a non-OK response, without ever logging the API key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new TmdbProvider(API_KEY, 1000);
    const logger = buildLogger();

    const result = await provider.search('dune', logger);

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }), expect.any(String));
    expect(JSON.stringify(loggedValues(logger))).not.toContain(API_KEY);
  });
});
