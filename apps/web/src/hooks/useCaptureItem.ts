import { useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { captureItem } from '../services/item.service';
import type { CaptureInput, MediaItem } from '../types/media-item.types';

const INBOX_QUERY_KEY = ['items', 'inbox'];

interface UseCaptureItemResult {
  capture: (
    input: CaptureInput,
    options?: MutateOptions<MediaItem, Error, CaptureInput>,
  ) => void;
  isLoading: boolean;
  error: Error | null;
}

export function useCaptureItem(): UseCaptureItemResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CaptureInput) => captureItem(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INBOX_QUERY_KEY });
    },
    onError: () => {
      toast.error("Couldn't capture that. Please try again.");
    },
  });

  return {
    capture: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
