import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { MediaItem } from '../../../types/media-item.types';
import { TextCard } from './TextCard';

const textItem: MediaItem = {
  id: '1',
  content: 'Remember to buy milk',
  type: 'TEXT',
  url: null,
  title: null,
  category: null,
  status: 'INBOX',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TextCard', () => {
  it('renders the captured text content', () => {
    render(<TextCard item={textItem} />);
    expect(screen.getByText('Remember to buy milk')).toBeInTheDocument();
  });
});
