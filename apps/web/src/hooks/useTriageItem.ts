import { useMutation, useQueryClient } from '@tanstack/react-query';

import { triageItem, type TriageItemInput } from '../services/item.service';
import type { MediaItem } from '../types/media-item.types';

const INBOX_QUERY_KEY = ['items', 'inbox'];

interface UseTriageItemResult {
  triage: (variables: { id: string; input: TriageItemInput }) => void;
  isLoading: boolean;
  error: Error | null;
}

// Triage moves the item to ORGANIZED, which removes it from the Inbox result set.
export function useTriageItem(): UseTriageItemResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TriageItemInput }) => triageItem(id, input),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: INBOX_QUERY_KEY });

      const previousItems = queryClient.getQueryData<MediaItem[]>(INBOX_QUERY_KEY);

      queryClient.setQueryData<MediaItem[]>(INBOX_QUERY_KEY, (items) =>
        items?.filter((item) => item.id !== id),
      );

      return { previousItems };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(INBOX_QUERY_KEY, context.previousItems);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY });
    },
  });

  return {
    triage: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
