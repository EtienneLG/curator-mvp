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

  async search(query: string): Promise<ProviderMetadata | null> {
    return withTimeout(this.timeoutMs, async (signal) => {
      const url = new URL(SEARCH_URL);
      url.searchParams.set('query', query);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
        signal,
      });

      if (!response.ok) {
        return null;
      }

      // TMDB's response is untrusted external input — validate before reading.
      const raw: unknown = await response.json();
      const result = TmdbSearchResponseSchema.safeParse(raw);
      if (!result.success) {
        return null;
      }

      const [topResult] = result.data.results;
      if (!topResult) {
        return null;
      }

      return {
        title: topResult.title,
        year: parseYear(topResult.release_date),
        creator: null, // TMDB search results don't include director/cast — out of scope for a search hit.
        description: topResult.overview ?? null,
      };
    });
  }
}
