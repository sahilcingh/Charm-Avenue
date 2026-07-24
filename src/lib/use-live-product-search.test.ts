import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveProductSearch } from './use-live-product-search';

const limitMock = vi.fn();

vi.mock('./supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          ilike: () => ({
            order: () => ({
              limit: limitMock,
            }),
          }),
        }),
      }),
    }),
  }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  limitMock.mockReset();
  limitMock.mockResolvedValue({
    data: [
      {
        id: 'p1',
        slug: 'panda-lamp',
        name: 'Panda Lamp',
        image: '/img.jpg',
        image_alt: 'alt',
        price: 130,
      },
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLiveProductSearch', () => {
  it('returns no results and does not query for a blank query', async () => {
    const { result } = renderHook(() => useLiveProductSearch(''));
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(limitMock).not.toHaveBeenCalled();
  });

  it('debounces the query before hitting supabase', async () => {
    renderHook(() => useLiveProductSearch('panda'));
    expect(limitMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(limitMock).toHaveBeenCalledTimes(1);
  });

  it('maps rows into the shape the dropdown expects, after debounce settles', async () => {
    const { result } = renderHook(() => useLiveProductSearch('panda'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]).toEqual({
      id: 'p1',
      slug: 'panda-lamp',
      name: 'Panda Lamp',
      image: '/img.jpg',
      imageAlt: 'alt',
      price: 130,
    });
    expect(result.current.loading).toBe(false);
  });

  it('resets to no results when the query is cleared back to blank', async () => {
    const { result, rerender } = renderHook(({ q }) => useLiveProductSearch(q), {
      initialProps: { q: 'panda' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(result.current.results).toHaveLength(1);

    rerender({ q: '' });
    expect(result.current.results).toEqual([]);
  });
});
