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
  const { isAdmin, user, refreshIsAdmin } = useAdminMode();
  return (
    <>
      <span data-testid="is-admin">{String(isAdmin)}</span>
      <span data-testid="user-email">{user?.email ?? ''}</span>
      <button onClick={() => refreshIsAdmin()}>refresh</button>
    </>
  );
}

/** A promise you can resolve from outside, to control exactly when an in-flight check settles. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
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

  it('refreshIsAdmin re-checks and returns the current admin status on demand', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    profileSingleMock.mockResolvedValue({ data: { is_admin: true } });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('is-admin')).toHaveTextContent('true'));

    profileSingleMock.mockResolvedValue({ data: { is_admin: false } });
    await act(async () => {
      screen.getByText('refresh').click();
    });
    await waitFor(() => expect(screen.getByTestId('is-admin')).toHaveTextContent('false'));
  });

  it(
    'shares a single in-flight profiles check between the SIGNED_IN listener and an explicit ' +
      'refreshIsAdmin() call for the same user, instead of firing a separate round trip for each ' +
      '(failure case: a caller like LoginForm running its own post-sign-in admin check used to ' +
      "duplicate the exact query this provider's own onAuthStateChange listener was already making)",
    async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      const { promise, resolve } = deferred<{ data: { is_admin: boolean } }>();
      profileSingleMock.mockReturnValue(promise);
      renderProbe();
      await waitFor(() => expect(screen.getByTestId('is-admin')).toHaveTextContent('false'));

      // A fresh sign-in fires this provider's own listener, which starts checking admin status...
      act(() => {
        authStateCallback?.('SIGNED_IN', { user: { id: 'admin-1' } });
      });
      // ...and, before that check resolves, something else (e.g. LoginForm) asks again for the
      // same user via the public API.
      getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
      await act(async () => {
        screen.getByText('refresh').click();
      });

      expect(profileSingleMock).toHaveBeenCalledTimes(1);

      resolve({ data: { is_admin: true } });
      await waitFor(() => expect(screen.getByTestId('is-admin')).toHaveTextContent('true'));
    }
  );
});
