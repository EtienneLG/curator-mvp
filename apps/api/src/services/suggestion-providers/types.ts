import type { ProviderMetadata } from '../../schemas/suggestion.schema.js';

// Adapter contract every category-specific provider (TMDB/Open Library/IGDB) implements
// (DEC-016). `search` takes Gemini's `searchQuery` and returns metadata already normalized
// into the shared `ProviderMetadata` shape, or `null` when there's no match/the call failed —
// providers never throw to their caller; `search` itself is expected to use `withTimeout`
// (below) internally so every provider degrades the same way.
export interface SuggestionProvider {
  search(query: string): Promise<ProviderMetadata | null>;
}

// Shared best-effort timeout wrapper used by the Gemini classifier and every provider
// (DEC-016 — a slow/broken external call must never block the refine-metadata modal or bubble
// up as a 5xx). `operation` receives an `AbortSignal` so callers can pass it straight into
// `fetch(url, { signal })` (or an SDK call that accepts one) and have the underlying network
// request actually cancelled on timeout, not just abandoned. Any rejection — timeout, network
// error, or a thrown validation error while parsing the response — resolves to `null`.
export async function withTimeout<T>(
  timeoutMs: number,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await operation(controller.signal);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
