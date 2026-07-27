import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';

import { createQueryClientWrapper } from '../../tests/test-utils';
import type { MediaItem } from '../types/media-item.types';
import { useDeleteItem } from './useDeleteItem';

const seedItems: MediaItem[] = [
  {
    id: '1',
    content: 'Remember to buy milk',
    type: 'TEXT',
    url: null,
    title: null,
    category: null,
    status: 'INBOX',
    createdAt: new Date('2026-01-02T10:00:00.000Z'),
  },
];

describe('useDeleteItem', () => {
  it('optimistically removes the deleted item from the inbox cache', async () => {
    const { Wrapper, queryClient } = createQueryClientWrapper();
    queryClient.setQueryData(['items', 'inbox'], seedItems);

    const { result } = renderHook(() => useDeleteItem(), { wrapper: Wrapper });

    act(() => {
      result.current.deleteItem('1');
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<MediaItem[]>(['items', 'inbox']);
      expect(cached).toHaveLength(0);
    });
  });
});
