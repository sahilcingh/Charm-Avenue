import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StockStatusSelect from './StockStatusSelect';
import { updateProductStockStatus } from './actions';

vi.mock('./actions', () => ({
  updateProductStockStatus: vi.fn(),
}));

const mockedUpdate = vi.mocked(updateProductStockStatus);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StockStatusSelect', () => {
  it('defaults to In Stock when the product has no stock_status set (untracked)', () => {
    render(<StockStatusSelect productId="p1" initialStatus={null} />);
    expect(screen.getByRole('combobox', { name: 'Stock status' })).toHaveValue('in_stock');
  });

  it('shows the product’s current stock status', () => {
    render(<StockStatusSelect productId="p1" initialStatus="made_to_order" />);
    expect(screen.getByRole('combobox', { name: 'Stock status' })).toHaveValue('made_to_order');
  });

  it('persists the new status as soon as the admin picks it, and it stays selected', async () => {
    mockedUpdate.mockResolvedValue(undefined);
    render(<StockStatusSelect productId="p1" initialStatus="in_stock" />);

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Stock status' }), {
        target: { value: 'out_of_stock' },
      });
    });

    expect(updateProductStockStatus).toHaveBeenCalledWith('p1', 'out_of_stock');
    expect(screen.getByRole('combobox', { name: 'Stock status' })).toHaveValue('out_of_stock');
  });

  it('reverts to the previous status and shows an error if the save fails', async () => {
    mockedUpdate.mockRejectedValue(new Error('db down'));
    render(<StockStatusSelect productId="p1" initialStatus="in_stock" />);

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Stock status' }), {
        target: { value: 'discontinued' },
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Stock status' })).toHaveValue('in_stock');
    });
    expect(screen.getByText('db down')).toBeInTheDocument();
  });
});
