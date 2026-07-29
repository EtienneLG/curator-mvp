import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../tests/msw/server';
import { createQueryClientWrapper } from '../../tests/test-utils';
import { useCaptureItem } from './useCaptureItem';

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}));

describe('useCaptureItem', () => {
  it('invalidates the inbox query on a successful capture', async () => {
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCaptureItem(), { wrapper: Wrapper });

    act(() => {
      result.current.capture({ content: 'A new note' });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items', 'inbox'] });
  });

  it('surfaces a toast and reports an error when the request fails', async () => {
    server.use(
      http.post('*/items', () =>
        HttpResponse.json({ error: { code: 'BAD_REQUEST', message: 'nope' } }, { status: 400 }),
      ),
    );

    const toast = (await import('react-hot-toast')).default;
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useCaptureItem(), { wrapper: Wrapper });

    act(() => {
      result.current.capture({ content: 'A new note' });
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(toast.error).toHaveBeenCalled();
  });
});
