import type { Logger } from '../../lib/logger.js';
import { TmdbCreditsResponseSchema, TmdbSearchResponseSchema } from '../../schemas/suggestion.schema.js';
import type { ProviderMetadata } from '../../schemas/suggestion.schema.js';
import type { SuggestionProvider } from './types.js';
import { withTimeout } from './types.js';

const SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';
const CREDITS_URL = 'https://api.themoviedb.org/3/movie';

// TMDB's `release_date` is `YYYY-MM-DD` (or an empty string when unknown) — only the year is
// surfaced in `ProviderMetadata`, matching the `MediaItem.year` field.
function parseYear(releaseDate: string | undefined): number | null {
  const year = Number(releaseDate?.slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

// No official TMDB Node SDK, so this is a small typed `fetch` call rather than a dependency.
export class TmdbProvider implements SuggestionProvider {
  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number,
  ) {}

  async search(query: string, logger: Logger): Promise<ProviderMetadata | null> {
    logger.info({ provider: 'tmdb', query }, 'Calling TMDB search API');

    const result = await withTimeout(
      this.timeoutMs,
      async (signal) => {
        const url = new URL(SEARCH_URL);
        url.searchParams.set('query', query);

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
          signal,
        });

        if (!response.ok) {
          logger.warn({ provider: 'tmdb', status: response.status }, 'TMDB search API returned a non-OK response');
          return null;
        }

        // TMDB's response is untrusted external input — validate before reading.
        const raw: unknown = await response.json();
        const parsed = TmdbSearchResponseSchema.safeParse(raw);
        if (!parsed.success) {
          logger.warn({ provider: 'tmdb' }, 'TMDB search API response failed schema validation');
          return null;
        }

        const [topResult] = parsed.data.results;
        if (!topResult) {
          logger.info({ provider: 'tmdb', query }, 'TMDB search API returned no results');
          return null;
        }

        return {
          title: topResult.title,
          year: parseYear(topResult.release_date),
          creator: await this.fetchDirector(topResult.id, signal, logger),
          description: topResult.overview ?? null,
        };
      },
      logger,
      { provider: 'tmdb', query },
    );

    if (result) {
      logger.info(
        { provider: 'tmdb', title: result.title, year: result.year, descriptionLength: result.description?.length ?? 0 },
        'TMDB search API returned metadata',
      );
    }

    return result;
  }

  // Second request against `/movie/{id}/credits` to find the director — TMDB's search results
  // don't include crew. Any failure here degrades to `null` without failing the whole `search()`
  // call, so a lost director never costs the caller the title/year/description already resolved.
  private async fetchDirector(movieId: number, signal: AbortSignal, logger: Logger): Promise<string | null> {
    try {
      const response = await fetch(`${CREDITS_URL}/${movieId}/credits`, {
        headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
        signal,
      });

      if (!response.ok) {
        logger.warn({ provider: 'tmdb', status: response.status }, 'TMDB credits API returned a non-OK response');
        return null;
      }

      // TMDB's response is untrusted external input — validate before reading.
      const raw: unknown = await response.json();
      const parsed = TmdbCreditsResponseSchema.safeParse(raw);
      if (!parsed.success) {
        logger.warn({ provider: 'tmdb' }, 'TMDB credits API response failed schema validation');
        return null;
      }

      return parsed.data.crew.find((member) => member.job === 'Director')?.name ?? null;
    } catch (error) {
      logger.warn(
        { provider: 'tmdb', err: error instanceof Error ? error.message : 'unknown error' },
        'TMDB credits API call aborted or threw',
      );
      return null;
    }
  }
}
