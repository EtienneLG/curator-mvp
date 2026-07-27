import { useQuery } from '@tanstack/react-query';

import { getInboxItems } from '../services/item.service';
import type { MediaItem } from '../types/media-item.types';

interface UseInboxItemsResult {
  data: MediaItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches the Inbox list (`status = INBOX`, newest-first — server-ordered).
 * Query key follows the `['entity', 'action', params]` convention (see
 * AGENTS.md → Query Key Convention).
 */
export function useInboxItems(): UseInboxItemsResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', 'inbox'],
    queryFn: getInboxItems,
  });

  return { data, isLoading, error };
}
