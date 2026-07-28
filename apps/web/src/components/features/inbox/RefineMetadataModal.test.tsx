import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { MediaItem } from '../../../types/media-item.types';
import { RefineMetadataModal } from './RefineMetadataModal';

const item: MediaItem = {
  id: '1',
  content: 'A movie to watch',
  title: null,
  category: null,
  year: null,
  creator: null,
  description: null,
  status: 'INBOX',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('RefineMetadataModal', () => {
  it('shows the raw capture and a manual-entry form', () => {
    render(<RefineMetadataModal item={item} onValidate={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: /refine metadata/i })).toBeInTheDocument();
    expect(screen.getByText('A movie to watch')).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/creator/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('requires a title before validating', async () => {
    const onValidate = vi.fn();
    render(<RefineMetadataModal item={item} onValidate={onValidate} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /validate/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/title is required/i);
    expect(onValidate).not.toHaveBeenCalled();
  });

  it('calls onValidate with the full refined payload', async () => {
    const onValidate = vi.fn();
    render(<RefineMetadataModal item={item} onValidate={onValidate} onClose={vi.fn()} />);

    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'MOVIE');
    await userEvent.type(screen.getByLabelText(/title/i), 'A Great Movie');
    await userEvent.type(screen.getByLabelText(/year/i), '2020');
    await userEvent.type(screen.getByLabelText(/creator/i), 'A Director');
    await userEvent.type(screen.getByLabelText(/description/i), 'A short synopsis');
    await userEvent.click(screen.getByRole('button', { name: /validate/i }));

    expect(onValidate).toHaveBeenCalledWith({
      category: 'MOVIE',
      title: 'A Great Movie',
      year: 2020,
      creator: 'A Director',
      description: 'A short synopsis',
    });
  });

  it('calls onClose when cancelled', async () => {
    const onClose = vi.fn();
    render(<RefineMetadataModal item={item} onValidate={vi.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
