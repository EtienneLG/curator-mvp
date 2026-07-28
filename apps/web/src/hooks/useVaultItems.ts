import { useQuery } from '@tanstack/react-query';

import { getVaultItems } from '../services/item.service';
import type { MediaItem } from '../types/media-item.types';

interface UseVaultItemsResult {
  data: MediaItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches the Vault list (`status = ORGANIZED`, newest-first — server-ordered).
 * Query key follows the `['entity', 'action', params]` convention (see
 * AGENTS.md → Query Key Convention). Category filtering is deferred — this
 * fetches the full unfiltered organized list.
 */
export function useVaultItems(): UseVaultItemsResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', 'vault'],
    queryFn: getVaultItems,
  });

  return { data, isLoading, error };
}
