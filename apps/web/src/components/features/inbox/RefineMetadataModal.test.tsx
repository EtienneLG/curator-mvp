import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createQueryClientWrapper } from '../../../../tests/test-utils';
import { partialSuggestionFixture, setSuggestionForItem } from '../../../../tests/msw/handlers';
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

function renderModal(props: Partial<Parameters<typeof RefineMetadataModal>[0]> = {}) {
  const { Wrapper } = createQueryClientWrapper();
  return render(
    <Wrapper>
      <RefineMetadataModal item={item} onValidate={vi.fn()} onClose={vi.fn()} {...props} />
    </Wrapper>,
  );
}

describe('RefineMetadataModal', () => {
  it('shows the raw capture and a manual-entry form', () => {
    renderModal();

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
    renderModal({ onValidate });

    await userEvent.click(screen.getByRole('button', { name: /validate/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/title is required/i);
    expect(onValidate).not.toHaveBeenCalled();
  });

  it('calls onValidate with the full refined payload', async () => {
    const onValidate = vi.fn();
    renderModal({ onValidate });

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
    renderModal({ onClose });

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a loading indicator while the suggestion is being fetched', () => {
    renderModal();

    expect(screen.getByRole('status')).toHaveTextContent(/looking for a suggestion/i);
  });

  it('shows no suggestion panel when the lookup has no match', async () => {
    renderModal();

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /^apply$/i })).not.toBeInTheDocument();
  });

  it('shows a suggestion panel and applies only its non-null fields on demand', async () => {
    setSuggestionForItem(item.id, partialSuggestionFixture);
    renderModal();

    const applyButton = await screen.findByRole('button', { name: /^apply$/i });
    expect(screen.getByText(partialSuggestionFixture.title!)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/creator/i), 'A manually typed creator');
    await userEvent.click(applyButton);

    expect(screen.getByLabelText(/category/i)).toHaveValue('MOVIE');
    expect(screen.getByLabelText(/title/i)).toHaveValue(partialSuggestionFixture.title);
    expect(screen.getByLabelText(/year/i)).toHaveValue(partialSuggestionFixture.year);
    // The suggestion had no creator, so the field the user already filled in is untouched.
    expect(screen.getByLabelText(/creator/i)).toHaveValue('A manually typed creator');
  });
});

