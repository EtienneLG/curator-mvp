import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { MediaItem } from '../../../types/media-item.types';
import { LinkCard } from './LinkCard';

const baseLinkItem: MediaItem = {
  id: '2',
  content: 'https://example.com/article',
  type: 'LINK',
  url: 'https://example.com/article',
  title: 'Example Article',
  category: null,
  status: 'INBOX',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('LinkCard', () => {
  it('renders the extracted title linking to the URL', () => {
    render(<LinkCard item={baseLinkItem} />);
    const link = screen.getByRole('link', { name: 'Example Article' });
    expect(link).toHaveAttribute('href', 'https://example.com/article');
  });

  it('falls back to the raw link when title extraction failed', () => {
    render(<LinkCard item={{ ...baseLinkItem, title: null }} />);
    expect(screen.getByRole('link', { name: 'https://example.com/article' })).toBeInTheDocument();
  });
});
