import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';

/**
 * Smoke test validating the Vitest + RTL + jsdom scaffolding wiring.
 * Replace/expand once real pages replace this placeholder.
 */
describe('HomePage', () => {
  it('renders the placeholder scaffold message', () => {
    render(<HomePage />);
    expect(screen.getByText(/curator/i)).toBeInTheDocument();
  });
});
