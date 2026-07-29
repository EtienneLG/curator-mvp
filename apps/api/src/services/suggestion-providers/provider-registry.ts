import type { Env } from '../../config/env.js';
import type { Category } from '../../schemas/item.schema.js';
import { IgdbProvider } from './igdb.provider.js';
import { OpenLibraryProvider } from './open-library.provider.js';
import { TmdbProvider } from './tmdb.provider.js';
import type { SuggestionProvider } from './types.js';

// Plain lookup map, not a plugin system — `Category` is a closed 4-value enum. `ARTICLE` maps
// to `null` since there's no article metadata provider; `suggestions.service` falls back to Gemini's guess.
export function createProviderRegistry(env: Env): Record<Category, SuggestionProvider | null> {
  return {
    MOVIE: new TmdbProvider(env.TMDB_API_KEY, env.SUGGESTION_TIMEOUT_MS),
    BOOK: new OpenLibraryProvider(env.SUGGESTION_TIMEOUT_MS),
    GAME: new IgdbProvider(env.IGDB_CLIENT_ID, env.IGDB_CLIENT_SECRET, env.SUGGESTION_TIMEOUT_MS),
    ARTICLE: null,
  };
}
