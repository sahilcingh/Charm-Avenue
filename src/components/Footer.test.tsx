import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Footer from './Footer';

describe('Footer', () => {
  it('credits Qyroxis with a link to their site, opened safely in a new tab', () => {
    render(<Footer />);
    const credit = screen.getByRole('link', { name: /Qyroxis/i });
    expect(credit).toHaveAttribute('href', 'https://www.qyroxis.com');
    expect(credit).toHaveAttribute('target', '_blank');
    expect(credit).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('centers the Qyroxis credit and styles it as a solid badge, distinct from the plain Privacy/Terms text beside it', () => {
    render(<Footer />);
    const credit = screen.getByRole('link', { name: /Qyroxis/i });
    expect(credit.className).toContain('justify-self-center');
    expect(credit.className).toContain('badge-pill');
    expect(credit).toHaveStyle({ background: 'var(--blush-rose-button)' });

    const terms = screen.getByRole('link', { name: 'Terms' });
    expect(terms.className).not.toContain('badge-pill');
  });
});
