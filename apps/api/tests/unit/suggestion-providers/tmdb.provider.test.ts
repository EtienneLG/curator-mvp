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

  it('logs the call and the resolved metadata on success, without ever logging the API key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ title: 'Dune', release_date: '2021-10-22', overview: 'A desert planet epic.' }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new TmdbProvider(API_KEY, 1000);
    const logger = buildLogger();

    const result = await provider.search('dune', logger);

    expect(result?.title).toBe('Dune');
    expect(logger.info).toHaveBeenCalled();
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
