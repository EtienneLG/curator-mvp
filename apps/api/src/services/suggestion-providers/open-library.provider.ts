import type { Logger } from '../../lib/logger.js';
import { OpenLibrarySearchResponseSchema, OpenLibraryWorkResponseSchema } from '../../schemas/suggestion.schema.js';
import type { ProviderMetadata } from '../../schemas/suggestion.schema.js';
import type { SuggestionProvider } from './types.js';
import { withTimeout } from './types.js';

const SEARCH_URL = 'https://openlibrary.org/search.json';
const WORK_BASE_URL = 'https://openlibrary.org';

// No official Open Library Node SDK, so this is a small typed `fetch` call rather than a dependency.
export class OpenLibraryProvider implements SuggestionProvider {
  constructor(private readonly timeoutMs: number) {}

  async search(query: string, logger: Logger): Promise<ProviderMetadata | null> {
    logger.info({ provider: 'open-library', query }, 'Calling Open Library search API');

    const result = await withTimeout(
      this.timeoutMs,
      async (signal) => {
        const url = new URL(SEARCH_URL);
        url.searchParams.set('q', query);
        url.searchParams.set('limit', '1');

        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal,
        });

        if (!response.ok) {
          logger.warn(
            { provider: 'open-library', status: response.status },
            'Open Library search API returned a non-OK response',
          );
          return null;
        }

        // Open Library's response is untrusted external input — validate before reading.
        const raw: unknown = await response.json();
        const parsed = OpenLibrarySearchResponseSchema.safeParse(raw);
        if (!parsed.success) {
          logger.warn({ provider: 'open-library' }, 'Open Library search API response failed schema validation');
          return null;
        }

        const [topResult] = parsed.data.docs;
        if (!topResult) {
          logger.info({ provider: 'open-library', query }, 'Open Library search API returned no results');
          return null;
        }

        return {
          title: topResult.title,
          year: topResult.first_publish_year ?? null,
          creator: topResult.author_name?.[0] ?? null,
          description: await this.fetchDescription(topResult.key, signal, logger),
        };
      },
      logger,
      { provider: 'open-library', query },
    );

    if (result) {
      logger.info(
        { provider: 'open-library', title: result.title, year: result.year, descriptionLength: result.description?.length ?? 0 },
        'Open Library search API returned metadata',
      );
    }

    return result;
  }

  // Second request against `/works/{key}.json` to find the synopsis — Open Library search
  // results don't include one. Any failure here degrades to `null` without failing the whole
  // `search()` call, so a lost description never costs the caller the title/year/creator already
  // resolved.
  private async fetchDescription(key: string | undefined, signal: AbortSignal, logger: Logger): Promise<string | null> {
    if (!key) {
      return null;
    }

    try {
      const response = await fetch(`${WORK_BASE_URL}${key}.json`, {
        headers: { Accept: 'application/json' },
        signal,
      });

      if (!response.ok) {
        logger.warn(
          { provider: 'open-library', status: response.status },
          'Open Library work API returned a non-OK response',
        );
        return null;
      }

      // Open Library's response is untrusted external input — validate before reading.
      const raw: unknown = await response.json();
      const parsed = OpenLibraryWorkResponseSchema.safeParse(raw);
      if (!parsed.success) {
        logger.warn({ provider: 'open-library' }, 'Open Library work API response failed schema validation');
        return null;
      }

      const { description } = parsed.data;
      if (description === undefined) {
        return null;
      }
      return typeof description === 'string' ? description : description.value;
    } catch (error) {
      logger.warn(
        { provider: 'open-library', err: error instanceof Error ? error.message : 'unknown error' },
        'Open Library work API call aborted or threw',
      );
      return null;
    }
  }
}
