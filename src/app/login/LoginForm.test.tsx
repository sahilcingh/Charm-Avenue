import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const signInMock = vi.fn();
const refreshIsAdminMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: signInMock },
  }),
}));

vi.mock('@/lib/admin-mode-context', () => ({
  useAdminMode: () => ({ refreshIsAdmin: refreshIsAdminMock }),
}));

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
  await user.type(screen.getByPlaceholderText('••••••••'), 'secret1');
}

beforeEach(() => {
  pushMock.mockReset();
  refreshMock.mockReset();
  signInMock.mockReset();
  refreshIsAdminMock.mockReset();
});

describe('LoginForm', () => {
  it('shows field errors and never calls Supabase when the form is submitted empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('shows a specific error and re-enables the button when the password is wrong', async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } });
    render(<LoginForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).not.toBeDisabled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it(
    'checks admin status through the shared AdminModeProvider check instead of running its own ' +
      'separate profiles query (failure case: this used to fire a second, duplicate profiles ' +
      "lookup racing the provider's own onAuthStateChange-triggered check for the exact same user)",
    async () => {
      const user = userEvent.setup();
      signInMock.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null });
      refreshIsAdminMock.mockResolvedValue(true);
      render(<LoginForm />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => expect(refreshIsAdminMock).toHaveBeenCalled());
      await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/products'));
    }
  );

  it(
    "never reverts to an idle, plain 'Sign In' button after a successful sign-in — it stays in a " +
      'continuous loading/redirecting state until navigation happens (failure case: the button ' +
      "used to revert to a normal, clickable 'Sign In' state after only ~1 second, while the " +
      'actual redirect silently took several more seconds — looking finished when it was not)',
    async () => {
      const user = userEvent.setup();
      let resolveRefresh!: (value: boolean) => void;
      signInMock.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null });
      refreshIsAdminMock.mockReturnValue(
        new Promise<boolean>((resolve) => {
          resolveRefresh = resolve;
        })
      );
      render(<LoginForm />);
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => expect(refreshIsAdminMock).toHaveBeenCalled());
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.textContent).not.toBe('Sign In');

      resolveRefresh(true);
      await waitFor(() => expect(pushMock).toHaveBeenCalled());
      // Still never reverted to idle in the brief window before the component would unmount.
      expect(screen.getByRole('button')).toBeDisabled();
    }
  );

  it('navigates non-admins to the requested "next" destination (or home)', async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    refreshIsAdminMock.mockResolvedValue(false);
    render(<LoginForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
  });
});
