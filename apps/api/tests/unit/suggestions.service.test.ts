import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../../src/lib/logger.js';
import type { GeminiClassifier } from '../../src/services/suggestion-providers/gemini.classifier.js';
import type { SuggestionProvider } from '../../src/services/suggestion-providers/types.js';
import { SuggestionsService } from '../../src/services/suggestions.service.js';
import type { Category } from '../../src/schemas/item.schema.js';

function buildLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger;
}

function buildRegistry(overrides: Partial<Record<Category, SuggestionProvider | null>> = {}) {
  return { MOVIE: null, BOOK: null, GAME: null, ARTICLE: null, ...overrides } as Record<Category, SuggestionProvider | null>;
}

describe('SuggestionsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs the URL branch and the resolved title on a successful webpage fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: async () => '<title>Example</title>' }),
    );

    const classify = vi.fn();
    const service = new SuggestionsService({ classify } as unknown as GeminiClassifier, buildRegistry(), 1000);
    const logger = buildLogger();

    const suggestion = await service.suggest('https://example.com/article', logger);

    expect(suggestion.title).toBe('Example');
    expect(classify).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ branch: 'url' }), 'Starting suggestion pipeline');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ stage: 'suggest-from-url', title: 'Example' }), expect.any(String));
  });

  it('logs the media-lookup branch, delegates to the classifier and provider, and logs the final category', async () => {
    const classify = vi.fn().mockResolvedValue({ category: 'MOVIE', searchQuery: 'Dune' });
    const search = vi.fn().mockResolvedValue({ title: 'Dune', year: 2021, creator: null, description: null });
    const service = new SuggestionsService(
      { classify } as unknown as GeminiClassifier,
      buildRegistry({ MOVIE: { search } }),
      1000,
    );
    const logger = buildLogger();

    const suggestion = await service.suggest('a desert planet movie', logger);

    expect(classify).toHaveBeenCalledWith('a desert planet movie', logger);
    expect(search).toHaveBeenCalledWith('Dune', logger);
    expect(suggestion.title).toBe('Dune');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ branch: 'media-lookup' }), 'Starting suggestion pipeline');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'suggest', category: 'MOVIE', title: 'Dune' }),
      'Suggestion pipeline resolved',
    );
  });

  it('logs a warning and returns an empty suggestion when classification fails', async () => {
    const classify = vi.fn().mockResolvedValue(null);
    const service = new SuggestionsService({ classify } as unknown as GeminiClassifier, buildRegistry(), 1000);
    const logger = buildLogger();

    const suggestion = await service.suggest('unclassifiable content', logger);

    expect(suggestion.category).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'suggest-from-media-lookup' }),
      'Classification failed — returning empty suggestion',
    );
  });
});
