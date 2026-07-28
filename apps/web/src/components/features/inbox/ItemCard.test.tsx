import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { MediaItem } from '../../../types/media-item.types';
import { ItemCard } from './ItemCard';

const textItem: MediaItem = {
  id: '1',
  content: 'Remember to buy milk',
  title: null,
  category: null,
  year: null,
  creator: null,
  description: null,
  status: 'INBOX',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const urlLikeItem: MediaItem = {
  ...textItem,
  id: '2',
  content: 'https://example.com',
  title: 'Example',
};

describe('ItemCard', () => {
  it('renders plain content as text', () => {
    render(<ItemCard item={textItem} />);
    expect(screen.getByText('Remember to buy milk')).toBeInTheDocument();
  });

  it('cosmetically auto-linkifies URL-shaped content, preferring the refined title', () => {
    render(<ItemCard item={urlLikeItem} />);
    expect(screen.getByRole('link', { name: 'Example' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
  });

  it('renders composed actions passed as children', () => {
    render(
      <ItemCard item={textItem}>
        <button type="button">Delete</button>
      </ItemCard>,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('invokes onClick when the card is tapped', async () => {
    const onClick = vi.fn();
    render(<ItemCard item={textItem} onClick={onClick} />);

    await userEvent.click(screen.getByText('Remember to buy milk'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
