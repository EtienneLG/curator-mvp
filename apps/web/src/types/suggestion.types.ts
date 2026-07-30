import { z } from 'zod';

import { CategorySchema } from './media-item.types';

// Mirrors the backend's `SuggestionSchema` (apps/api/src/schemas/suggestion.schema.ts).
// Every field is best-effort and nullable — a failed/partial lookup returns nulls rather
// than an error, and must never block the refine-metadata modal from opening (DEC-016).
export const SuggestionSchema = z.object({
  category: CategorySchema.nullable(),
  title: z.string().nullable(),
  year: z.number().int().nullable(),
  creator: z.string().nullable(),
  description: z.string().nullable(),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;

// A suggestion is worth showing only if at least one field resolved to a non-null value.
export function hasSuggestedData(suggestion: Suggestion): boolean {
  return Object.values(suggestion).some((value) => value != null);
}
