import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import AppImage from './AppImage';

describe('AppImage', () => {
  it('renders the given src', () => {
    render(<AppImage src="/a.jpg" alt="A" />);
    expect(screen.getByAltText('A')).toHaveAttribute('src', expect.stringContaining('a.jpg'));
  });

  it('updates the rendered image when the src prop changes on an already-mounted instance (failure case: a caller swapping the photo, e.g. a product card previewing a different color variant, must not get stuck on the first image)', () => {
    const { rerender } = render(<AppImage src="/a.jpg" alt="A" />);
    expect(screen.getByAltText('A')).toHaveAttribute('src', expect.stringContaining('a.jpg'));

    rerender(<AppImage src="/b.jpg" alt="A" />);

    expect(screen.getByAltText('A')).toHaveAttribute('src', expect.stringContaining('b.jpg'));
  });

  it('resets a prior error/fallback state once a new src is supplied', () => {
    const { rerender } = render(<AppImage src="/broken.jpg" alt="A" fallbackSrc="/fallback.jpg" />);
    const img = screen.getByAltText('A');
    act(() => {
      img.dispatchEvent(new Event('error'));
    });
    expect(img).toHaveAttribute('src', expect.stringContaining('fallback.jpg'));

    rerender(<AppImage src="/good.jpg" alt="A" fallbackSrc="/fallback.jpg" />);

    expect(screen.getByAltText('A')).toHaveAttribute('src', expect.stringContaining('good.jpg'));
  });
});
