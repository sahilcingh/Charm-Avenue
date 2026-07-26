import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import VariantsManager from './VariantsManager';
import { updateVariant } from './actions';
import type { DbProductVariant } from '@/lib/supabase/types';

vi.mock('./actions', () => ({
  addVariant: vi.fn(),
  updateVariant: vi.fn(),
  removeVariant: vi.fn(),
}));

function makeVariant(overrides: Partial<DbProductVariant> = {}): DbProductVariant {
  return {
    id: 'v1',
    product_id: 'p1',
    color: null,
    size: null,
    sku: null,
    price_override: null,
    original_price_override: null,
    image: null,
    stock_status: null,
    stock_count: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VariantsManager — photo required once a color is set', () => {
  it('blocks saving a color with no photo (new blank variant) and shows a hint', async () => {
    render(<VariantsManager productId="p1" variants={[makeVariant()]} />);

    const colorInput = screen.getByPlaceholderText('Red');
    act(() => {
      fireEvent.change(colorInput, { target: { value: 'Red' } });
    });

    expect(screen.getByText(/needed/)).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: 'Save variant' }).click();
    });

    expect(screen.getByText(/Please add a photo for this color/)).toBeInTheDocument();
    expect(updateVariant).not.toHaveBeenCalled();
  });

  it('allows saving when the variant already has a saved photo', async () => {
    render(
      <VariantsManager
        productId="p1"
        variants={[makeVariant({ color: 'Pink', image: '/pink.jpg' })]}
      />
    );

    const sizeInput = screen.getByPlaceholderText('M');
    act(() => {
      fireEvent.change(sizeInput, { target: { value: 'L' } });
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Save variant' }).click();
    });

    expect(updateVariant).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Please add a photo/)).not.toBeInTheDocument();
  });

  it('does not require a photo when no color is set', async () => {
    render(<VariantsManager productId="p1" variants={[makeVariant()]} />);

    const sizeInput = screen.getByPlaceholderText('M');
    act(() => {
      fireEvent.change(sizeInput, { target: { value: 'M' } });
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Save variant' }).click();
    });

    expect(updateVariant).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Please add a photo/)).not.toBeInTheDocument();
  });
});

function fileOfSize(bytes: number, name = 'photo.jpg'): File {
  return new File([new Uint8Array(bytes)], name, { type: 'image/jpeg' });
}

describe('VariantsManager — photo picking validates size before it can reach Save', () => {
  it('rejects an oversized phone photo with a clear message instead of letting it through to Save (reproduces the "unexpected response from the server" crash)', async () => {
    render(<VariantsManager productId="p1" variants={[makeVariant({ color: 'Blue' })]} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [fileOfSize(9 * 1024 * 1024)] } });
    });

    expect(screen.getByText(/too large/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save variant' })).not.toBeInTheDocument();
  });

  it('accepts a normally-sized photo and marks the row dirty so it can be saved', async () => {
    render(<VariantsManager productId="p1" variants={[makeVariant({ color: 'Blue' })]} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [fileOfSize(500 * 1024)] } });
    });

    expect(screen.queryByText(/too large/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save variant' })).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: 'Save variant' }).click();
    });

    expect(updateVariant).toHaveBeenCalledTimes(1);
  });
});
