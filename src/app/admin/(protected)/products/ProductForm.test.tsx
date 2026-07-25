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
