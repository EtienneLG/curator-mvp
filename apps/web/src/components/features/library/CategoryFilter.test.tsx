import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useUIStore } from '../../../stores/ui.store';
import { CategoryFilter } from './CategoryFilter';

describe('CategoryFilter', () => {
  it('renders All plus every category option, defaulting to All', () => {
    render(<CategoryFilter />);

    const select = screen.getByLabelText('Category');
    expect(select).toHaveValue('ALL');
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Movie' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Book' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Game' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Article' })).toBeInTheDocument();
  });

  it('updates the shared UI store when a category is selected', async () => {
    render(<CategoryFilter />);

    await userEvent.selectOptions(screen.getByLabelText('Category'), 'BOOK');

    expect(useUIStore.getState().libraryCategoryFilter).toBe('BOOK');
    expect(screen.getByLabelText('Category')).toHaveValue('BOOK');
  });
});
