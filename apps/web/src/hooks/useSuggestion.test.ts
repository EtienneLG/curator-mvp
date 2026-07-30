import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createQueryClientWrapper } from '../../tests/test-utils';
import { movieSuggestionFixture, setSuggestionForItem } from '../../tests/msw/handlers';
import { useSuggestion } from './useSuggestion';

describe('useSuggestion', () => {
  it('fetches the suggestion for the given item id', async () => {
    setSuggestionForItem('1', movieSuggestionFixture);
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useSuggestion('1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual(movieSuggestionFixture));
    expect(result.current.error).toBeNull();
  });

  it('resolves to an empty/null suggestion when the backend has no match', async () => {
    const { Wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useSuggestion('unmatched'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({
      category: null,
      title: null,
      year: null,
      creator: null,
      description: null,
    });
  });
});
