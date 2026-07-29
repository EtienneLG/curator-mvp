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

  async search(query: string): Promise<ProviderMetadata | null> {
    return withTimeout(this.timeoutMs, async (signal) => {
      const token = await this.getAccessToken(signal);
      if (!token) {
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
        return null;
      }

      // IGDB's response is untrusted external input — validate before reading.
      const raw: unknown = await response.json();
      const result = IgdbSearchResponseSchema.safeParse(raw);
      if (!result.success) {
        return null;
      }

      const [topResult] = result.data;
      if (!topResult) {
        return null;
      }

      return {
        title: topResult.name,
        year: parseYear(topResult.first_release_date),
        creator: topResult.involved_companies?.[0]?.company.name ?? null,
        description: topResult.summary ?? null,
      };
    });
  }

  // Returns the cached Twitch token if still valid, otherwise fetches and caches a fresh one.
  private async getAccessToken(signal: AbortSignal): Promise<string | null> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.accessToken;
    }

    const url = new URL(TOKEN_URL);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('client_secret', this.clientSecret);
    url.searchParams.set('grant_type', 'client_credentials');

    const response = await fetch(url, { method: 'POST', signal });
    if (!response.ok) {
      return null;
    }

    const raw: unknown = await response.json();
    const result = TwitchTokenResponseSchema.safeParse(raw);
    if (!result.success) {
      return null;
    }

    this.cachedToken = {
      accessToken: result.data.access_token,
      expiresAt: Date.now() + result.data.expires_in * 1000 - TOKEN_EXPIRY_SAFETY_MARGIN_MS,
    };
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
