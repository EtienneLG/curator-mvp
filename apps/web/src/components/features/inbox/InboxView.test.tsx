import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../../tests/msw/server';
import { createQueryClientWrapper } from '../../../../tests/test-utils';
import { InboxView } from './InboxView';

describe('InboxView', () => {
  it('renders the inbox items newest-first once loaded', async () => {
    const { Wrapper } = createQueryClientWrapper();
    render(<InboxView />, { wrapper: Wrapper });

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
    expect(screen.getByText('Remember to buy milk')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Example Article' })).toBeInTheDocument();
  });

  it('removes a card from the list when its category is chosen', async () => {
    const { Wrapper } = createQueryClientWrapper();
    render(<InboxView />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));

    const [firstCard] = screen.getAllByRole('listitem');
    if (!firstCard) throw new Error('expected at least one listitem');
    await userEvent.click(within(firstCard).getByRole('button', { name: /movie/i }));

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
  });

  it('removes a card from the list when it is deleted', async () => {
    const { Wrapper } = createQueryClientWrapper();
    render(<InboxView />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));

    const [firstCard] = screen.getAllByRole('listitem');
    if (!firstCard) throw new Error('expected at least one listitem');
    await userEvent.click(within(firstCard).getByRole('button', { name: /delete item/i }));

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
  });

  it('renders an empty state when there are no inbox items', async () => {
    server.use(http.get('*/items', () => HttpResponse.json([])));

    const { Wrapper } = createQueryClientWrapper();
    render(<InboxView />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText(/inbox is empty/i)).toBeInTheDocument());
  });

  it('renders an error state when the request fails', async () => {
    server.use(http.get('*/items', () => HttpResponse.json(null, { status: 500 })));

    const { Wrapper } = createQueryClientWrapper();
    render(<InboxView />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
