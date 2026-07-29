import { useQuery } from '@tanstack/react-query';

import { getLibraryItems } from '../services/item.service';
import type { MediaItem } from '../types/media-item.types';

interface UseLibraryItemsResult {
  data: MediaItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

// Category filtering is deferred — this fetches the full unfiltered organized list.
export function useLibraryItems(): UseLibraryItemsResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', 'library'],
    queryFn: getLibraryItems,
  });

  return { data, isLoading, error };
}
