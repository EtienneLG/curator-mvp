import type { Logger } from '../../lib/logger.js';
import { TmdbSearchResponseSchema } from '../../schemas/suggestion.schema.js';
import type { ProviderMetadata } from '../../schemas/suggestion.schema.js';
import type { SuggestionProvider } from './types.js';
import { withTimeout } from './types.js';

const SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';

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
          creator: null, // TMDB search results don't include director/cast — out of scope for a search hit.
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
}
