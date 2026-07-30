import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteItem } from '../services/item.service';
import type { MediaItem } from '../types/media-item.types';

const INBOX_QUERY_KEY = ['items', 'inbox'];
const LIBRARY_QUERY_KEY = ['items', 'library'];

// An item only ever lives in one of the two lists at a time (INBOX or ORGANIZED), but the
// caller doesn't know which — updating both caches is a safe no-op for the list that
// doesn't contain the item.
const ITEM_LIST_QUERY_KEYS = [INBOX_QUERY_KEY, LIBRARY_QUERY_KEY];

interface UseDeleteItemResult {
  deleteItem: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
}

// Delete is permanent — no soft-delete or trash bin.
export function useDeleteItem(): UseDeleteItemResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onMutate: async (id) => {
      await Promise.all(
        ITEM_LIST_QUERY_KEYS.map((queryKey) => queryClient.cancelQueries({ queryKey })),
      );

      const previousItemsByQueryKey = ITEM_LIST_QUERY_KEYS.map(
        (queryKey) => [queryKey, queryClient.getQueryData<MediaItem[]>(queryKey)] as const,
      );

      ITEM_LIST_QUERY_KEYS.forEach((queryKey) => {
        queryClient.setQueryData<MediaItem[]>(queryKey, (items) =>
          items?.filter((item) => item.id !== id),
        );
      });

      return { previousItemsByQueryKey };
    },
    onError: (_error, _id, context) => {
      context?.previousItemsByQueryKey.forEach(([queryKey, previousItems]) => {
        if (previousItems) {
          queryClient.setQueryData(queryKey, previousItems);
        }
      });
    },
    onSettled: () => {
      ITEM_LIST_QUERY_KEYS.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  return {
    deleteItem: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
