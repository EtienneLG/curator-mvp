import { EMPTY_SUGGESTION, type Suggestion } from '../schemas/suggestion.schema.js';
import type { Category } from '../schemas/item.schema.js';
import type { GeminiClassifier } from './suggestion-providers/gemini.classifier.js';
import type { SuggestionProvider } from './suggestion-providers/types.js';
import { withTimeout } from './suggestion-providers/types.js';

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

  async suggest(content: string): Promise<Suggestion> {
    const url = parseAsUrl(content);
    return url ? this.suggestFromUrl(url) : this.suggestFromMediaLookup(content);
  }

  private async suggestFromUrl(url: URL): Promise<Suggestion> {
    const result = await withTimeout(this.timeoutMs, async (signal) => {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        return null;
      }
      const html = await response.text();
      return { title: extractTitle(html), description: extractDescription(html) };
    });

    return {
      ...EMPTY_SUGGESTION,
      title: result?.title ?? null,
      description: result?.description ?? null,
    };
  }

  private async suggestFromMediaLookup(content: string): Promise<Suggestion> {
    const classification = await this.geminiClassifier.classify(content);
    if (!classification) {
      return EMPTY_SUGGESTION;
    }

    const { category, searchQuery } = classification;
    const provider = this.providerRegistry[category];

    // No provider for this category (ARTICLE) — Gemini's own guess is the final, partial suggestion.
    if (!provider) {
      return { ...EMPTY_SUGGESTION, category, title: searchQuery };
    }

    const metadata = await provider.search(searchQuery);
    if (!metadata) {
      // Category alone still prefills the modal's category selector, even if the provider lookup failed.
      return { ...EMPTY_SUGGESTION, category };
    }

    return { category, ...metadata };
  }
}
