import type { Logger } from '../lib/logger.js';
import { EMPTY_SUGGESTION, type Suggestion } from '../schemas/suggestion.schema.js';
import type { Category } from '../schemas/item.schema.js';
import type { GeminiClassifier } from './suggestion-providers/gemini.classifier.js';
import type { SuggestionProvider } from './suggestion-providers/types.js';
import { truncateForLog, withTimeout } from './suggestion-providers/types.js';

// Extracts the first `<title>` tag from raw HTML; a regex is enough since only the title/description are read.
function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return match?.[1]?.trim() || null;
}

// Extracts a `<meta name="description" content="...">` value from raw HTML, if present.
function extractDescription(html: string): string | null {
  const match = /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i.exec(html);
  return match?.[1]?.trim() || null;
}

function parseAsUrl(content: string): URL | null {
  try {
    return new URL(content);
  } catch {
    return null;
  }
}

// Decides per `content` whether to fetch a webpage or run the classify → provider media lookup;
// `items.service` only asks for a suggestion, never the branching. Never throws — failures degrade to `EMPTY_SUGGESTION`.
export class SuggestionsService {
  constructor(
    private readonly geminiClassifier: GeminiClassifier,
    private readonly providerRegistry: Record<Category, SuggestionProvider | null>,
    private readonly timeoutMs: number,
  ) {}

  async suggest(content: string, logger: Logger): Promise<Suggestion> {
    const url = parseAsUrl(content);
    logger.info(
      { stage: 'suggest', contentPreview: truncateForLog(content), branch: url ? 'url' : 'media-lookup' },
      'Starting suggestion pipeline',
    );

    const suggestion = url
      ? await this.suggestFromUrl(url, logger)
      : await this.suggestFromMediaLookup(content, logger);

    logger.info(
      { stage: 'suggest', category: suggestion.category, title: suggestion.title },
      'Suggestion pipeline resolved',
    );
    return suggestion;
  }

  private async suggestFromUrl(url: URL, logger: Logger): Promise<Suggestion> {
    logger.info({ stage: 'suggest-from-url', url: url.toString() }, 'Fetching webpage for title/description');

    const result = await withTimeout(
      this.timeoutMs,
      async (signal) => {
        const response = await fetch(url, { signal });
        if (!response.ok) {
          logger.warn(
            { stage: 'suggest-from-url', status: response.status },
            'Webpage fetch returned a non-OK response',
          );
          return null;
        }
        const html = await response.text();
        return { title: extractTitle(html), description: extractDescription(html) };
      },
      logger,
      { stage: 'suggest-from-url', url: url.toString() },
    );

    logger.info(
      { stage: 'suggest-from-url', title: result?.title ?? null, descriptionLength: result?.description?.length ?? 0 },
      'Webpage fetch resolved',
    );

    return {
      ...EMPTY_SUGGESTION,
      title: result?.title ?? null,
      description: result?.description ?? null,
    };
  }

  private async suggestFromMediaLookup(content: string, logger: Logger): Promise<Suggestion> {
    const classification = await this.geminiClassifier.classify(content, logger);
    if (!classification) {
      logger.warn({ stage: 'suggest-from-media-lookup' }, 'Classification failed — returning empty suggestion');
      return EMPTY_SUGGESTION;
    }

    const { category, searchQuery } = classification;
    const provider = this.providerRegistry[category];

    // No provider for this category (ARTICLE) — Gemini's own guess is the final, partial suggestion.
    if (!provider) {
      logger.info(
        { stage: 'suggest-from-media-lookup', category },
        'No metadata provider for this category — using classifier guess as-is',
      );
      return { ...EMPTY_SUGGESTION, category, title: searchQuery };
    }

    const metadata = await provider.search(searchQuery, logger);
    if (!metadata) {
      // Category alone still prefills the modal's category selector, even if the provider lookup failed.
      logger.warn(
        { stage: 'suggest-from-media-lookup', category },
        'Provider lookup failed — returning category-only suggestion',
      );
      return { ...EMPTY_SUGGESTION, category };
    }

    return { category, ...metadata };
  }
}
