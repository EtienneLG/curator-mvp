import { useQuery } from '@tanstack/react-query';

import { getSuggestion } from '../services/suggestion.service';
import type { Suggestion } from '../types/suggestion.types';

interface UseSuggestionResult {
  data: Suggestion | undefined;
  isLoading: boolean;
  error: Error | null;
}

// Fetches automatically once `itemId` is set (i.e. as soon as the refine-metadata modal
// opens for an item), per DEC-016. Best-effort — never retried, since the backend already
// degrades to an empty/partial suggestion on failure rather than throwing.
export function useSuggestion(itemId: string): UseSuggestionResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', 'suggestions', itemId],
    queryFn: () => getSuggestion(itemId),
    enabled: Boolean(itemId),
    retry: false,
  });

  return { data, isLoading, error };
}
