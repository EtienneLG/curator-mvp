import { useQuery } from '@tanstack/react-query';

import { getLibraryItems } from '../services/item.service';
import type { MediaItem } from '../types/media-item.types';

interface UseLibraryItemsResult {
  data: MediaItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches the Library list (`status = ORGANIZED`, newest-first — server-ordered).
 * Query key follows the `['entity', 'action', params]` convention (see
 * AGENTS.md → Query Key Convention). Category filtering is deferred — this
 * fetches the full unfiltered organized list.
 */
export function useLibraryItems(): UseLibraryItemsResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', 'library'],
    queryFn: getLibraryItems,
  });

  return { data, isLoading, error };
}
