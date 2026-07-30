import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getLibraryItems } from '../services/item.service';
import { useUIStore } from '../stores/ui.store';
import type { MediaItem } from '../types/media-item.types';

interface UseLibraryItemsResult {
  data: MediaItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

// Fetches the full organized list, then applies the active category filter (Zustand-owned
// UI state) client-side — see docs/ARCHITECTURE.md for the documented backend-filtering path,
// deferred until the Library list is paginated.
export function useLibraryItems(): UseLibraryItemsResult {
  const libraryCategoryFilter = useUIStore((state) => state.libraryCategoryFilter);
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', 'library'],
    queryFn: getLibraryItems,
  });

  const filteredData = useMemo(() => {
    if (!data || libraryCategoryFilter === 'ALL') {
      return data;
    }
    return data.filter((item) => item.category === libraryCategoryFilter);
  }, [data, libraryCategoryFilter]);

  return { data: filteredData, isLoading, error };
}
