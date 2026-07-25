import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import AdminAccountMenu from './AdminAccountMenu';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: signOutMock },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  signOutMock.mockResolvedValue({ error: null });
});

describe('AdminAccountMenu', () => {
  it('shows the first letter of the email as the avatar', () => {
    render(<AdminAccountMenu email="jane@example.com" />);
    expect(screen.getByRole('button', { name: 'Account menu' })).toHaveTextContent('J');
  });

  it('falls back to "?" when there is no email', () => {
    render(<AdminAccountMenu email={null} />);
    expect(screen.getByRole('button', { name: 'Account menu' })).toHaveTextContent('?');
  });

  it('opens the menu with View Store and Sign Out on click, closed by default', () => {
    render(<AdminAccountMenu email="jane@example.com" />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'Account menu' }).click());

    expect(screen.getByRole('menuitem', { name: /view store/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
  });

  it('toggles closed when the account button is clicked again', () => {
    render(<AdminAccountMenu email="jane@example.com" />);
    const trigger = screen.getByRole('button', { name: 'Account menu' });

    act(() => trigger.click());
    expect(screen.getByRole('menu')).toBeInTheDocument();

    act(() => trigger.click());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the menu when clicking outside of it', () => {
    render(
      <div>
        <AdminAccountMenu email="jane@example.com" />
        <button>outside</button>
      </div>
    );
    act(() => screen.getByRole('button', { name: 'Account menu' }).click());
    expect(screen.getByRole('menu')).toBeInTheDocument();

    act(() => {
      screen
        .getByRole('button', { name: 'outside' })
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('signs out and redirects to /login when Sign Out is clicked', async () => {
    render(<AdminAccountMenu email="jane@example.com" />);
    act(() => screen.getByRole('button', { name: 'Account menu' }).click());

    await act(async () => {
      screen.getByRole('menuitem', { name: /sign out/i }).click();
    });

    expect(signOutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(refreshMock).toHaveBeenCalled();
  });
});
