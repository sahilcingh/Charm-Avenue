import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AdminModeProvider, useAdminMode } from './admin-mode-context';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();
let authStateCallback: ((event: string, session: { user: unknown } | null) => void) | null = null;

vi.mock('./supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      onAuthStateChange: (cb: (event: string, session: { user: unknown } | null) => void) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: profileSingleMock }) }),
    }),
  }),
}));

function Probe() {
  const { isAdmin, user } = useAdminMode();
  return (
    <>
      <span data-testid="is-admin">{String(isAdmin)}</span>
      <span data-testid="user-email">{user?.email ?? ''}</span>
    </>
  );
}

function renderProbe() {
  return render(
    <AdminModeProvider>
      <Probe />
    </AdminModeProvider>
  );
}

beforeEach(() => {
  getUserMock.mockReset();
  profileSingleMock.mockReset();
  authStateCallback = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminModeProvider', () => {
  it('reports isAdmin false for a signed-out visitor', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('is-admin')).toHaveTextContent('false'));
  });

  it('reports isAdmin false for a logged-in non-admin', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    profileSingleMock.mockResolvedValue({ data: { is_admin: false } });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('is-admin')).toHaveTextContent('false'));
  });

  it('reports isAdmin true for a logged-in admin', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    profileSingleMock.mockResolvedValue({ data: { is_admin: true } });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('is-admin')).toHaveTextContent('true'));
  });

  it("exposes the logged-in user so consumers (e.g. Header's account initial) don't need their own separate auth.getUser() call", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'jane@example.com' } },
    });
    profileSingleMock.mockResolvedValue({ data: { is_admin: false } });
    renderProbe();
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent('jane@example.com')
    );
  });

  it('clears the exposed user and isAdmin on sign-out', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'jane@example.com' } } });
    profileSingleMock.mockResolvedValue({ data: { is_admin: true } });
    renderProbe();
    await waitFor(() =>
      expect(screen.getByTestId('user-email')).toHaveTextContent('jane@example.com')
    );
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true');

    act(() => {
      authStateCallback?.('SIGNED_OUT', null);
    });

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent(''));
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
  });
});
