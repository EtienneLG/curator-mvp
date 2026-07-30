import { apiFetch } from './api-client';

import { SuggestionSchema, type Suggestion } from '../types/suggestion.types';

// Best-effort, refine-time-only lookup (DEC-016) — always resolves to a `Suggestion`
// (fields may be null), the backend never surfaces a failed lookup as an HTTP error.
export async function getSuggestion(id: string): Promise<Suggestion> {
  const data = await apiFetch<unknown>(`/items/${id}/suggestions`);
  return SuggestionSchema.parse(data);
}
