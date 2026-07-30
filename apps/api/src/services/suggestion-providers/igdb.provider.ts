import type { Logger } from '../../lib/logger.js';
import { IgdbSearchResponseSchema, TwitchTokenResponseSchema } from '../../schemas/suggestion.schema.js';
import type { ProviderMetadata } from '../../schemas/suggestion.schema.js';
import type { SuggestionProvider } from './types.js';
import { withTimeout } from './types.js';

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const GAMES_URL = 'https://api.igdb.com/v4/games';

// Safety margin subtracted from the token's reported lifetime so a request never starts with a
// token that expires mid-flight.
const TOKEN_EXPIRY_SAFETY_MARGIN_MS = 60_000;

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

// IGDB reuses Twitch's identity platform — a Client Credentials token is fetched from
// `id.twitch.tv` and cached in-memory until it expires, avoiding a token fetch per request.
export class IgdbProvider implements SuggestionProvider {
  private cachedToken: CachedToken | null = null;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly timeoutMs: number,
  ) {}

  async search(query: string, logger: Logger): Promise<ProviderMetadata | null> {
    logger.info({ provider: 'igdb', query }, 'Calling IGDB search API');

    const result = await withTimeout(
      this.timeoutMs,
      async (signal) => {
        const token = await this.getAccessToken(signal, logger);
        if (!token) {
          logger.warn({ provider: 'igdb' }, 'IGDB search skipped — no access token available');
          return null;
        }

        // IGDB's query language (Apicalypse) is a plain-text body, not JSON.
        const response = await fetch(GAMES_URL, {
          method: 'POST',
          headers: {
            'Client-ID': this.clientId,
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: `search "${query}"; fields name,first_release_date,summary,involved_companies.company.name; limit 1;`,
          signal,
        });

        if (!response.ok) {
          logger.warn({ provider: 'igdb', status: response.status }, 'IGDB search API returned a non-OK response');
          return null;
        }

        // IGDB's response is untrusted external input — validate before reading.
        const raw: unknown = await response.json();
        const parsed = IgdbSearchResponseSchema.safeParse(raw);
        if (!parsed.success) {
          logger.warn({ provider: 'igdb' }, 'IGDB search API response failed schema validation');
          return null;
        }
        
        const [topResult] = parsed.data;
        if (!topResult) {
          logger.info({ provider: 'igdb', query }, 'IGDB search API returned no results');
          return null;
        }

        return {
          title: topResult.name,
          year: parseYear(topResult.first_release_date),
          creator: topResult.involved_companies?.[0]?.company.name ?? null,
          description: topResult.summary ?? null,
        };
      },
      logger,
      { provider: 'igdb', query },
    );

    if (result) {
      logger.info(
        { provider: 'igdb', title: result.title, year: result.year, descriptionLength: result.description?.length ?? 0 },
        'IGDB search API returned metadata',
      );
    }

    return result;
  }

  // Returns the cached Twitch token if still valid, otherwise fetches and caches a fresh one.
  // Never logs the token/secret itself — only whether the cache was used and the fetch outcome.
  private async getAccessToken(signal: AbortSignal, logger: Logger): Promise<string | null> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      logger.info({ provider: 'igdb' }, 'Using cached Twitch access token');
      return this.cachedToken.accessToken;
    }

    logger.info({ provider: 'igdb' }, 'Fetching a fresh Twitch access token');

    const url = new URL(TOKEN_URL);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('client_secret', this.clientSecret);
    url.searchParams.set('grant_type', 'client_credentials');

    const response = await fetch(url, { method: 'POST', signal });
    if (!response.ok) {
      logger.warn({ provider: 'igdb', status: response.status }, 'Twitch token request returned a non-OK response');
      return null;
    }

    const raw: unknown = await response.json();
    const result = TwitchTokenResponseSchema.safeParse(raw);
    if (!result.success) {
      logger.warn({ provider: 'igdb' }, 'Twitch token response failed schema validation');
      return null;
    }

    this.cachedToken = {
      accessToken: result.data.access_token,
      expiresAt: Date.now() + result.data.expires_in * 1000 - TOKEN_EXPIRY_SAFETY_MARGIN_MS,
    };
    logger.info({ provider: 'igdb' }, 'Cached a fresh Twitch access token');
    return this.cachedToken.accessToken;
  }
}

// IGDB dates are unix seconds.
function parseYear(unixSeconds: number | undefined): number | null {
  if (unixSeconds === undefined) {
    return null;
  }
  return new Date(unixSeconds * 1000).getUTCFullYear();
}
