import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../tests/msw/server';
import { createQueryClientWrapper } from '../../tests/test-utils';
import { useInboxItems } from './useInboxItems';

describe('useInboxItems', () => {
  it('fetches and returns the inbox list, newest-first as provided by the API', async () => {
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useInboxItems(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].id).toBe('1');
  });

  it('surfaces an error when the request fails', async () => {
    server.use(http.get('*/items', () => HttpResponse.json(null, { status: 500 })));

    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useInboxItems(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeUndefined();
  });
});
