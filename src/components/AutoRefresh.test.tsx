import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import AutoRefresh from './AutoRefresh';

const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
}

beforeEach(() => {
  refreshMock.mockReset();
  vi.useFakeTimers();
  setVisibility('visible');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AutoRefresh', () => {
  it('renders nothing', () => {
    const { container } = render(<AutoRefresh />);
    expect(container).toBeEmptyDOMElement();
  });

  it('calls router.refresh() once the interval elapses', () => {
    render(<AutoRefresh intervalMs={25000} />);

    expect(refreshMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(25000);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('keeps refreshing on every subsequent interval', () => {
    render(<AutoRefresh intervalMs={10000} />);

    vi.advanceTimersByTime(10000);
    vi.advanceTimersByTime(10000);
    vi.advanceTimersByTime(10000);

    expect(refreshMock).toHaveBeenCalledTimes(3);
  });

  it('does not refresh on an interval tick while the tab is hidden (backgrounded — avoid wasted queries)', () => {
    setVisibility('hidden');
    render(<AutoRefresh intervalMs={10000} />);

    vi.advanceTimersByTime(10000);

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('refreshes immediately when the tab becomes visible again after being hidden', () => {
    setVisibility('hidden');
    render(<AutoRefresh intervalMs={10000} />);

    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('stops refreshing after unmount (no leaked interval/listener)', () => {
    const { unmount } = render(<AutoRefresh intervalMs={10000} />);
    unmount();

    vi.advanceTimersByTime(30000);
    document.dispatchEvent(new Event('visibilitychange'));

    expect(refreshMock).not.toHaveBeenCalled();
  });
});
