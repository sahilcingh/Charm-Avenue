import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupForm from './SignupForm';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const signUpMock = vi.fn();
const verifyOtpMock = vi.fn();
const resendMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({ auth: { signUp: signUpMock, verifyOtp: verifyOtpMock, resend: resendMock } }),
}));

vi.mock('@/lib/toast-context', () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByPlaceholderText('Your name'), 'Nandini');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'nandini@charmavenue.in');
    await user.type(screen.getByPlaceholderText('At least 6 characters'), 'secret1');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret1');
}

async function fillFormAndReachOtpStep(user: ReturnType<typeof userEvent.setup>) {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    render(<SignupForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(await screen.findByText('Check your inbox')).toBeInTheDocument();
}

beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    signUpMock.mockReset();
    verifyOtpMock.mockReset();
    resendMock.mockReset();
    showToastMock.mockReset();
});

describe('SignupForm', () => {
    it('shows field errors and never calls Supabase when the form is submitted empty', async () => {
        const user = userEvent.setup();
        render(<SignupForm />);

        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(await screen.findByText('Please enter your name.')).toBeInTheDocument();
        expect(signUpMock).not.toHaveBeenCalled();
    });

    it('signs up and redirects home when Supabase returns a session immediately', async () => {
        signUpMock.mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null });
        const user = userEvent.setup();
        render(<SignupForm />);

        await fillValidForm(user);
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
        expect(signUpMock).toHaveBeenCalledWith({
            email: 'nandini@charmavenue.in',
            password: 'secret1',
            options: { data: { name: 'Nandini' } },
        });
    });

    it('shows the OTP entry step when Supabase returns no session (email confirmation required)', async () => {
        const user = userEvent.setup();
        await fillFormAndReachOtpStep(user);
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('shows the SAME "check your inbox" step for an already-registered email as for a new one (security case: prevents probing arbitrary emails to discover registered accounts)', async () => {
        signUpMock.mockResolvedValue({ data: { session: null }, error: { message: 'User already registered' } });
        const user = userEvent.setup();
        render(<SignupForm />);

        await fillValidForm(user);
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(await screen.findByText('Check your inbox')).toBeInTheDocument();
        expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('shows a friendly error for a genuine unexpected failure (failure case, unrelated to account enumeration)', async () => {
        signUpMock.mockResolvedValue({ data: { session: null }, error: { message: 'Some unrelated backend error' } });
        const user = userEvent.setup();
        render(<SignupForm />);

        await fillValidForm(user);
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('verifies a valid 6-digit code and redirects home', async () => {
        verifyOtpMock.mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null });
        const user = userEvent.setup();
        await fillFormAndReachOtpStep(user);

        await user.type(screen.getByPlaceholderText('123456'), '482913');
        await user.click(screen.getByRole('button', { name: 'Verify & Continue' }));

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
        expect(verifyOtpMock).toHaveBeenCalledWith({ email: 'nandini@charmavenue.in', token: '482913', type: 'signup' });
    });

    it('shows a validation error and never calls Supabase for a malformed code (edge case)', async () => {
        const user = userEvent.setup();
        await fillFormAndReachOtpStep(user);

        await user.type(screen.getByPlaceholderText('123456'), '12');
        await user.click(screen.getByRole('button', { name: 'Verify & Continue' }));

        expect(await screen.findByText('Enter the 6-digit code from your email.')).toBeInTheDocument();
        expect(verifyOtpMock).not.toHaveBeenCalled();
    });

    it('shows a friendly error for a wrong or expired code (failure case)', async () => {
        verifyOtpMock.mockResolvedValue({ data: { session: null }, error: { message: 'Token has expired or is invalid' } });
        const user = userEvent.setup();
        await fillFormAndReachOtpStep(user);

        await user.type(screen.getByPlaceholderText('123456'), '000000');
        await user.click(screen.getByRole('button', { name: 'Verify & Continue' }));

        expect(await screen.findByText('That code is incorrect or has expired. Please request a new one.')).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('resends the code and toasts confirmation', async () => {
        resendMock.mockResolvedValue({ error: null });
        const user = userEvent.setup();
        await fillFormAndReachOtpStep(user);

        await user.click(screen.getByRole('button', { name: 'Resend code' }));

        await waitFor(() => expect(resendMock).toHaveBeenCalledWith({ type: 'signup', email: 'nandini@charmavenue.in' }));
        expect(showToastMock).toHaveBeenCalledWith('A new code is on its way.');
    });
});
