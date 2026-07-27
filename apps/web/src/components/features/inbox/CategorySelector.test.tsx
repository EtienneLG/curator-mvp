import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategorySelector } from './CategorySelector';

describe('CategorySelector', () => {
  it('emits the chosen category on tap', async () => {
    const onSelect = vi.fn();
    render(<CategorySelector onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /movie/i }));

    expect(onSelect).toHaveBeenCalledWith('MOVIE');
  });

  it('renders all four fixed categories', () => {
    render(<CategorySelector onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /movie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /book/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /article/i })).toBeInTheDocument();
  });
});
