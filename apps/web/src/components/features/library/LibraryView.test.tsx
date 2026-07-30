import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../../tests/msw/server';
import { createQueryClientWrapper } from '../../../../tests/test-utils';
import { LibraryView } from './LibraryView';

describe('LibraryView', () => {
  it('renders the library items newest-first once loaded, read-only', async () => {
    const { Wrapper } = createQueryClientWrapper();
    render(<LibraryView />, { wrapper: Wrapper });

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Example Movie' })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /delete item/i })).not.toBeInTheDocument();
  });

  it('renders an empty state when there are no library items', async () => {
    server.use(http.get('*/items', () => HttpResponse.json([])));

    const { Wrapper } = createQueryClientWrapper();
    render(<LibraryView />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText(/library is empty/i)).toBeInTheDocument());
  });

  it('renders an error state when the request fails', async () => {
    server.use(http.get('*/items', () => HttpResponse.json(null, { status: 500 })));

    const { Wrapper } = createQueryClientWrapper();
    render(<LibraryView />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('opens the item detail modal when a card is clicked', async () => {
    const { Wrapper } = createQueryClientWrapper();
    render(<LibraryView />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
    await userEvent.click(screen.getByText('Dune'));

    expect(screen.getByRole('dialog', { name: /item details/i })).toBeInTheDocument();
    expect(screen.getByText('A science fiction novel.')).toBeInTheDocument();
  });

  it('closes the modal when the close button is clicked', async () => {
    const { Wrapper } = createQueryClientWrapper();
    render(<LibraryView />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
    await userEvent.click(screen.getByText('Dune'));
    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deletes the item and closes the modal when delete is clicked', async () => {
    const { Wrapper } = createQueryClientWrapper();
    render(<LibraryView />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
    await userEvent.click(screen.getByText('Dune'));
    await userEvent.click(screen.getByRole('button', { name: /delete item/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Dune')).not.toBeInTheDocument());
  });
});

