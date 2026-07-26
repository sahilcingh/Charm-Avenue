import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import TrustCTA from './TrustCTA';

beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

describe('TrustCTA — social links', () => {
  it('links to the real Instagram profile, opened safely in a new tab', () => {
    render(<TrustCTA />);
    const link = screen.getByRole('link', { name: 'Charm Avenue on Instagram' });
    expect(link).toHaveAttribute(
      'href',
      'https://www.instagram.com/charm_avenue.in?igsh=Z3FkazM2MDV2cGUw'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('links to a WhatsApp chat with the real business number, opened safely in a new tab', () => {
    render(<TrustCTA />);
    const link = screen.getByRole('link', { name: 'Charm Avenue on WhatsApp' });
    expect(link).toHaveAttribute('href', 'https://wa.me/918957298041');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('shows the YouTube and Facebook logos without turning them into links to nowhere (accounts not made yet)', () => {
    render(<TrustCTA />);

    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /YouTube/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Facebook/ })).not.toBeInTheDocument();
  });

  it('exposes exactly two real links overall (Instagram and WhatsApp)', () => {
    render(<TrustCTA />);
    const socialLinks = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('aria-label')?.startsWith('Charm Avenue on'));
    expect(socialLinks).toHaveLength(2);
  });
});
