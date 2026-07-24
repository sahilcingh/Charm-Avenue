import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { AdminModeProvider, useAdminMode } from './admin-mode-context';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();

vi.mock('./supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: profileSingleMock }) }),
    }),
  }),
}));

function Probe() {
  const { isAdmin } = useAdminMode();
  return <span data-testid="is-admin">{String(isAdmin)}</span>;
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
});
