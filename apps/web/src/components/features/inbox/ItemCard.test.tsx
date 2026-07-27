import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { MediaItem } from '../../../types/media-item.types';
import { ItemCard } from './ItemCard';

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

const linkItem: MediaItem = {
  ...textItem,
  id: '2',
  type: 'LINK',
  content: 'https://example.com',
  url: 'https://example.com',
  title: 'Example',
};

describe('ItemCard', () => {
  it('renders a TextCard for TEXT items', () => {
    render(<ItemCard item={textItem} />);
    expect(screen.getByText('Remember to buy milk')).toBeInTheDocument();
  });

  it('renders a LinkCard for LINK items', () => {
    render(<ItemCard item={linkItem} />);
    expect(screen.getByRole('link', { name: 'Example' })).toBeInTheDocument();
  });

  it('renders composed actions passed as children', () => {
    render(
      <ItemCard item={textItem}>
        <button type="button">Delete</button>
      </ItemCard>,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
