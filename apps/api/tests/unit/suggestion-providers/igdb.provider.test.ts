import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../../../src/lib/logger.js';
import { IgdbProvider } from '../../../src/services/suggestion-providers/igdb.provider.js';

const CLIENT_SECRET = 'super-secret-twitch-secret';
const ACCESS_TOKEN = 'super-secret-access-token';

function buildLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger;
}

function loggedValues(logger: Logger) {
  const calls = [...(logger.info as ReturnType<typeof vi.fn>).mock.calls, ...(logger.warn as ReturnType<typeof vi.fn>).mock.calls];
  return calls.flat();
}

describe('IgdbProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs the token fetch and search call/result, without ever logging the client secret or access token', async () => {
    const fetchMock = vi
      .fn()
      // Twitch token request
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: ACCESS_TOKEN, expires_in: 3600 }) })
      // IGDB games search
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { name: 'Portal', first_release_date: 1224806400, summary: 'Puzzle game.', involved_companies: [{ company: { name: 'Valve' } }] },
        ],
      });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new IgdbProvider('client-id', CLIENT_SECRET, 1000);
    const logger = buildLogger();

    const result = await provider.search('portal', logger);

    expect(result?.title).toBe('Portal');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ provider: 'igdb' }), 'Fetching a fresh Twitch access token');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ provider: 'igdb', title: 'Portal' }), expect.any(String));

    const loggedText = JSON.stringify(loggedValues(logger));
    expect(loggedText).not.toContain(CLIENT_SECRET);
    expect(loggedText).not.toContain(ACCESS_TOKEN);
  });

  it('logs a warning and returns null when the Twitch token request fails, without logging the secret', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new IgdbProvider('client-id', CLIENT_SECRET, 1000);
    const logger = buildLogger();

    const result = await provider.search('portal', logger);

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ provider: 'igdb', status: 401 }), expect.any(String));
    expect(JSON.stringify(loggedValues(logger))).not.toContain(CLIENT_SECRET);
  });
});
