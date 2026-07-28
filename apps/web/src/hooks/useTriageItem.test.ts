import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';

import { createQueryClientWrapper } from '../../tests/test-utils';
import type { MediaItem } from '../types/media-item.types';
import { useTriageItem } from './useTriageItem';

const seedItems: MediaItem[] = [
  {
    id: '1',
    content: 'Remember to buy milk',
    title: null,
    category: null,
    year: null,
    creator: null,
    description: null,
    status: 'INBOX',
    createdAt: new Date('2026-01-02T10:00:00.000Z'),
  },
  {
    id: '2',
    content: 'https://example.com/article',
    title: null,
    category: null,
    year: null,
    creator: null,
    description: null,
    status: 'INBOX',
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
  },
];

describe('useTriageItem', () => {
  it('optimistically removes the triaged item from the inbox cache', async () => {
    const { Wrapper, queryClient } = createQueryClientWrapper();
    queryClient.setQueryData(['items', 'inbox'], seedItems);

    const { result } = renderHook(() => useTriageItem(), { wrapper: Wrapper });

    act(() => {
      result.current.triage({
        id: '1',
        input: {
          category: 'BOOK',
          title: 'A Great Book',
          year: 2020,
          creator: 'An Author',
          description: 'A short synopsis',
        },
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<MediaItem[]>(['items', 'inbox']);
      expect(cached?.some((item) => item.id === '1')).toBe(false);
    });
  });
});
