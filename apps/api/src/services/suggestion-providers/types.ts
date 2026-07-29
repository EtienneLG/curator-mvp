import type { ProviderMetadata } from '../../schemas/suggestion.schema.js';

// `search` returns metadata normalized into `ProviderMetadata`, or `null` when there's no
// match/the call failed — providers never throw to their caller.
export interface SuggestionProvider {
  search(query: string): Promise<ProviderMetadata | null>;
}

// Best-effort timeout wrapper: `operation` receives an AbortSignal to pass into `fetch`/SDK
// calls so the underlying request is actually cancelled on timeout. Any rejection (timeout,
// network error, validation error) resolves to `null` instead of throwing.
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
