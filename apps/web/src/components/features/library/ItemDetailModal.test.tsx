import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { MediaItem } from '../../../types/media-item.types';
import { ItemDetailModal } from './ItemDetailModal';

const item: MediaItem = {
  id: '3',
  content: 'Dune',
  title: 'Dune',
  category: 'BOOK',
  year: 1965,
  creator: 'Frank Herbert',
  description: 'A science fiction novel.',
  status: 'ORGANIZED',
  createdAt: new Date('2026-01-04T10:00:00.000Z'),
};

describe('ItemDetailModal', () => {
  it('shows the full metadata for the item', () => {
    render(<ItemDetailModal item={item} onDelete={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: /item details/i })).toBeInTheDocument();
    expect(screen.getByText('Book')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
    expect(screen.getByText('1965')).toBeInTheDocument();
    expect(screen.getByText('A science fiction novel.')).toBeInTheDocument();
  });

  it('calls onDelete when the delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<ItemDetailModal item={item} onDelete={onDelete} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /delete item/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(<ItemDetailModal item={item} onDelete={vi.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
