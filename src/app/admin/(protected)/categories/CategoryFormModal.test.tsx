import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import React from 'react';
import CategoryFormModal from './CategoryFormModal';
import { createCategory, updateCategory } from './actions';
import type { DbCategory } from '@/lib/supabase/types';

vi.mock('./actions', () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}));

const category: DbCategory = {
  slug: 'jewellery',
  title: 'Anti-Tarnish Jewellery',
  subtitle: 'Rings · Bracelets',
  emoji: '💍',
  tag: 'Best Seller',
  image: 'https://cdn/jewellery.jpg',
  image_alt: 'Jewellery',
  tag_bg: '#E8828F',
  tag_text: '#FFFFFF',
  description: 'Jewellery that stays.',
  sort_order: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom has neither of these — handleFiles' post-compression preview/re-assignment
  // touches both, so a minimal stub is enough to exercise the file-selection path in tests.
  if (!('DataTransfer' in globalThis)) {
    class FakeDataTransfer {
      files: File[] = [];
      items = { add: (file: File) => this.files.push(file) };
    }
    // @ts-expect-error test-only stub, not a full DataTransfer implementation
    globalThis.DataTransfer = FakeDataTransfer;
  }
  if (!URL.createObjectURL) {
    URL.createObjectURL = () => 'blob:mock';
  }
});

describe('CategoryFormModal', () => {
  it('renders nothing when closed', () => {
    render(<CategoryFormModal open={false} onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(screen.queryByText('Add Category')).not.toBeInTheDocument();
  });

  it('shows "Add Category" heading and empty fields in create mode', () => {
    render(<CategoryFormModal open onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Add Category' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Anti-Tarnish Jewellery')).toHaveValue('');
  });

  it('shows "Edit Category" heading with fields pre-filled from the category prop', () => {
    render(<CategoryFormModal open onClose={vi.fn()} category={category} onSaved={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Edit Category' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Anti-Tarnish Jewellery')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jewellery that stays.')).toBeInTheDocument();
  });

  it('submits the edited fields via updateCategory and reports the saved row', async () => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    const saved = { ...category, title: 'Updated Name' };
    vi.mocked(updateCategory).mockResolvedValue(saved);

    render(<CategoryFormModal open onClose={onClose} category={category} onSaved={onSaved} />);

    const nameInput = screen.getByDisplayValue('Anti-Tarnish Jewellery');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    });

    await act(async () => {
      screen.getByRole('button', { name: /save changes/i }).click();
    });

    await waitFor(() => expect(updateCategory).toHaveBeenCalledTimes(1));
    expect(updateCategory).toHaveBeenCalledWith('jewellery', expect.any(FormData));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the thrown error message and does not close on failure', async () => {
    const onClose = vi.fn();
    vi.mocked(updateCategory).mockRejectedValue(new Error('Something went wrong.'));

    render(<CategoryFormModal open onClose={onClose} category={category} onSaved={vi.fn()} />);

    await act(async () => {
      screen.getByRole('button', { name: /save changes/i }).click();
    });

    await waitFor(() => expect(screen.getByText('Something went wrong.')).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls createCategory in create mode', async () => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    vi.mocked(createCategory).mockResolvedValue(category);

    render(<CategoryFormModal open onClose={onClose} onSaved={onSaved} />);

    const nameInput = screen.getByPlaceholderText('Anti-Tarnish Jewellery');
    const subtitleInput = screen.getByPlaceholderText('Rings · Bracelets · Neckchains');
    const descriptionInput = document.querySelector(
      'textarea[name="description"]'
    ) as HTMLTextAreaElement;
    const tagInput = screen.getByPlaceholderText('Best Seller');
    const fileInput = document.querySelector('input[name="imageFile"]') as HTMLInputElement;
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Category' } });
      fireEvent.change(subtitleInput, { target: { value: 'Sub' } });
      fireEvent.change(descriptionInput, { target: { value: 'Desc' } });
      fireEvent.change(tagInput, { target: { value: 'New' } });
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // jsdom's constraint validation doesn't recognize a programmatically-assigned
    // files list as satisfying `required` on the file input, so a real button
    // click would be silently blocked — submit the form directly instead, which
    // still exercises the exact same React 19 form-action handler.
    await act(async () => {
      fireEvent.submit(fileInput.closest('form') as HTMLFormElement);
    });

    await waitFor(() => expect(createCategory).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(category));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<CategoryFormModal open onClose={onClose} onSaved={vi.fn()} />);
    screen.getByRole('button', { name: 'Close' }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
