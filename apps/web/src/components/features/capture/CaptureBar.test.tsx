import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../../../tests/msw/server';
import { createQueryClientWrapper } from '../../../../tests/test-utils';
import { CaptureBar } from './CaptureBar';

describe('CaptureBar', () => {
  it('captures a new item and clears the input on success', async () => {
    const { Wrapper, queryClient } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    render(<CaptureBar />, { wrapper: Wrapper });

    const input = screen.getByLabelText(/capture a note or link/i);
    await userEvent.type(input, 'Remember to water the plants');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => expect(input).toHaveValue(''));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items', 'inbox'] });
  });

  it('shows a validation error and does not submit for empty input', async () => {
    const { Wrapper } = createQueryClientWrapper();
    render(<CaptureBar />, { wrapper: Wrapper });

    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/enter something to capture/i);
  });

  it('keeps the input content when the request fails', async () => {
    server.use(
      http.post('*/items', () =>
        HttpResponse.json({ error: { code: 'BAD_REQUEST', message: 'nope' } }, { status: 400 }),
      ),
    );

    const { Wrapper } = createQueryClientWrapper();
    render(<CaptureBar />, { wrapper: Wrapper });

    const input = screen.getByLabelText(/capture a note or link/i);
    await userEvent.type(input, 'This will fail');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /add/i })).toBeEnabled());
    expect(input).toHaveValue('This will fail');
  });
});
