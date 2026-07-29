import { OpenLibrarySearchResponseSchema } from '../../schemas/suggestion.schema.js';
import type { ProviderMetadata } from '../../schemas/suggestion.schema.js';
import type { SuggestionProvider } from './types.js';
import { withTimeout } from './types.js';

const SEARCH_URL = 'https://openlibrary.org/search.json';

// No official Open Library Node SDK, so this is a small typed `fetch` call rather than a dependency.
export class OpenLibraryProvider implements SuggestionProvider {
  constructor(private readonly timeoutMs: number) {}

  async search(query: string): Promise<ProviderMetadata | null> {
    return withTimeout(this.timeoutMs, async (signal) => {
      const url = new URL(SEARCH_URL);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', '1');

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal,
      });

      if (!response.ok) {
        return null;
      }

      // Open Library's response is untrusted external input — validate before reading.
      const raw: unknown = await response.json();
      const result = OpenLibrarySearchResponseSchema.safeParse(raw);
      if (!result.success) {
        return null;
      }

      const [topResult] = result.data.docs;
      if (!topResult) {
        return null;
      }

      return {
        title: topResult.title,
        year: topResult.first_publish_year ?? null,
        creator: topResult.author_name?.[0] ?? null,
        description: null, // Open Library search results don't include a synopsis.
      };
    });
  }
}
