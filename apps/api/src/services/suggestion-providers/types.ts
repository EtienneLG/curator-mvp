import type { Logger } from '../../lib/logger.js';
import type { ProviderMetadata } from '../../schemas/suggestion.schema.js';

// `search` returns metadata normalized into `ProviderMetadata`, or `null` when there's no
// match/the call failed — providers never throw to their caller. `logger` is the caller's
// request-scoped logger, threaded through so every log line can be tied back to one request.
export interface SuggestionProvider {
  search(query: string, logger: Logger): Promise<ProviderMetadata | null>;
}

const LOG_PREVIEW_LENGTH = 200;

// Truncates free-form user content before it's written to a log line, so a long capture note
// never bloats a log entry (and isn't logged in full unnecessarily).
export function truncateForLog(value: string, maxLength = LOG_PREVIEW_LENGTH): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

// Best-effort timeout wrapper: `operation` receives an AbortSignal to pass into `fetch`/SDK
// calls so the underlying request is actually cancelled on timeout. Any rejection (timeout,
// network error, validation error) resolves to `null` instead of throwing. When `logger`/
// `context` are provided, the caught error is logged as a warning (message only — never the
// raw error object, which could carry sensitive request details).
export async function withTimeout<T>(
  timeoutMs: number,
  operation: (signal: AbortSignal) => Promise<T>,
  logger?: Logger,
  context?: Record<string, unknown>,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await operation(controller.signal);
  } catch (error) {
    logger?.warn(
      { ...context, err: error instanceof Error ? error.message : 'unknown error' },
      'Suggestion pipeline step aborted or threw',
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}
