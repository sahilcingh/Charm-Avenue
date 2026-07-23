import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { resolveAdminModeState, AdminModeProvider, useAdminMode } from './admin-mode-context';

describe('resolveAdminModeState', () => {
  it('keeps admin mode off when there is no stored preference yet', () => {
    expect(resolveAdminModeState({ isAdmin: true, storedPreference: false })).toBe(false);
  });

  it('turns admin mode on when an admin has a stored "on" preference', () => {
    expect(resolveAdminModeState({ isAdmin: true, storedPreference: true })).toBe(true);
  });

  it('never lets a stale "on" preference leak to a non-admin account sharing the browser', () => {
    expect(resolveAdminModeState({ isAdmin: false, storedPreference: true })).toBe(false);
  });

  it('stays off for a non-admin with no stored preference', () => {
    expect(resolveAdminModeState({ isAdmin: false, storedPreference: false })).toBe(false);
  });
});

const getUserMock = vi.fn();

vi.mock('./supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: { is_admin: true } }) }),
      }),
    }),
  }),
}));

function Probe() {
  const { adminModeOn, toggleAdminMode } = useAdminMode();
  return (
    <div>
      <span data-testid="admin-mode-state">{String(adminModeOn)}</span>
      <button onClick={toggleAdminMode}>toggle</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <AdminModeProvider>
      <Probe />
    </AdminModeProvider>
  );
}

describe('AdminModeProvider — reproduces the production crash on browsers that block storage', () => {
  beforeEach(() => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not crash on mount when localStorage.getItem throws (Safari private browsing / storage-blocked mobile browsers — failure case reproducing the production incident)', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    expect(() => renderProbe()).not.toThrow();

    await waitFor(() => expect(screen.getByTestId('admin-mode-state')).toHaveTextContent('false'));
  });

  it('does not crash when toggling admin mode while localStorage.setItem throws', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('admin-mode-state')).toHaveTextContent('false'));

    expect(() => act(() => screen.getByRole('button', { name: 'toggle' }).click())).not.toThrow();
    await waitFor(() => expect(screen.getByTestId('admin-mode-state')).toHaveTextContent('true'));
  });
});
