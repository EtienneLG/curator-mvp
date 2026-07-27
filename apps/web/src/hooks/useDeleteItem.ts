import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteItem } from '../services/item.service';
import type { MediaItem } from '../types/media-item.types';

const INBOX_QUERY_KEY = ['items', 'inbox'];

interface UseDeleteItemResult {
  deleteItem: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Delete is permanent and immediate — no soft-delete, no trash bin
 * (docs/PROJECT.md → Business Rules). Optimistically drops the card from the
 * `['items', 'inbox']` cache for instant UX, rolling back on failure.
 */
export function useDeleteItem(): UseDeleteItemResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: INBOX_QUERY_KEY });

      const previousItems = queryClient.getQueryData<MediaItem[]>(INBOX_QUERY_KEY);

      queryClient.setQueryData<MediaItem[]>(INBOX_QUERY_KEY, (items) =>
        items?.filter((item) => item.id !== id),
      );

      return { previousItems };
    },
    onError: (_error, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(INBOX_QUERY_KEY, context.previousItems);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY });
    },
  });

  return {
    deleteItem: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
