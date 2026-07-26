import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProductForm from './ProductForm';

function renderForm() {
  return render(<ProductForm categories={[]} action={vi.fn()} />);
}

describe('ProductForm — product photo upload accessibility', () => {
  it(
    'is reachable by keyboard and opens the file picker on Enter/Space (failure case: the ' +
      'dropzone had tabIndex="-1" and no role, so Tab skipped straight over the required photo ' +
      "field entirely — a keyboard-only admin couldn't open the file picker at all)",
    () => {
      renderForm();

      const dropzone = screen.getByRole('button', { name: /photo/i });
      expect(dropzone).toHaveAttribute('tabIndex', '0');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      // fireEvent dispatches the raw key event with none of user-event's own built-in ARIA
      // "role=button implies Enter/Space activates it" simulation, so this exercises the
      // component's own onKeyDown handler in isolation — real browsers don't auto-activate a
      // plain div[role=button] on keydown; the component has to do it itself.
      fireEvent.keyDown(dropzone, { key: 'Enter' });
      expect(clickSpy).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(dropzone, { key: ' ' });
      expect(clickSpy).toHaveBeenCalledTimes(2);
    }
  );
});

describe('ProductForm — New Arrivals/Best Sellers toggles', () => {
  it('renders both toggles unchecked by default for a new product', () => {
    renderForm();

    const newArrival = screen.getByRole('checkbox', { name: 'Show in New Arrivals' });
    const bestSeller = screen.getByRole('checkbox', { name: 'Show in Best Sellers' });
    expect(newArrival).not.toBeChecked();
    expect(bestSeller).not.toBeChecked();
    expect(newArrival).toHaveAttribute('name', 'isNewArrival');
    expect(bestSeller).toHaveAttribute('name', 'isBestSeller');
  });

  it('checking a toggle updates its own checked state independently of the other', () => {
    renderForm();

    const newArrival = screen.getByRole('checkbox', { name: 'Show in New Arrivals' });
    const bestSeller = screen.getByRole('checkbox', { name: 'Show in Best Sellers' });

    fireEvent.click(newArrival);
    expect(newArrival).toBeChecked();
    expect(bestSeller).not.toBeChecked();
  });
});
