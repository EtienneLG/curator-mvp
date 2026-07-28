import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('renders links to Inbox and Vault', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vault' })).toBeInTheDocument();
  });

  it('marks the current route as active', () => {
    render(
      <MemoryRouter initialEntries={['/vault']}>
        <BottomNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Vault' })).toHaveClass('text-blue-600');
    expect(screen.getByRole('link', { name: 'Inbox' })).not.toHaveClass('text-blue-600');
  });
});
