import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DeleteButton } from './DeleteButton';

describe('DeleteButton', () => {
  it('triggers deletion when tapped', async () => {
    const onDelete = vi.fn();
    render(<DeleteButton onDelete={onDelete} />);

    await userEvent.click(screen.getByRole('button', { name: /delete item/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
