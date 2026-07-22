const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function isValidEmail(email: string): boolean {
    return EMAIL_PATTERN.test(email.trim());
}

export function validatePassword(password: string): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return null;
}

export interface SignupFormInput {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export type SignupFormErrors = Partial<Record<keyof SignupFormInput, string>>;

export function validateSignupForm(input: SignupFormInput): SignupFormErrors {
    const errors: SignupFormErrors = {};

    if (!input.name.trim()) {
        errors.name = 'Please enter your name.';
    }
    if (!isValidEmail(input.email)) {
        errors.email = 'Please enter a valid email address.';
    }
    const passwordError = validatePassword(input.password);
    if (passwordError) {
        errors.password = passwordError;
    }
    if (!input.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password.';
    } else if (input.confirmPassword !== input.password) {
        errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
}

export interface LoginFormInput {
    email: string;
    password: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormInput, string>>;

export function validateLoginForm(input: LoginFormInput): LoginFormErrors {
    const errors: LoginFormErrors = {};

    if (!isValidEmail(input.email)) {
        errors.email = 'Please enter a valid email address.';
    }
    if (!input.password) {
        errors.password = 'Please enter your password.';
    }

    return errors;
}

const OTP_PATTERN = /^\d{6}$/;

/** Validates the 6-digit email verification code Supabase sends on signup. */
export function validateOtp(code: string): string | null {
    if (!OTP_PATTERN.test(code.trim())) {
        return 'Enter the 6-digit code from your email.';
    }
    return null;
}

/** First letter for a header/account avatar badge — falls back to "?" when there's nothing to show. */
export function getInitial(nameOrEmail: string): string {
    const trimmed = nameOrEmail.trim();
    return trimmed ? trimmed[0].toUpperCase() : '?';
}

export interface ResolveLoginRedirectInput {
    next?: string | null;
}

/**
 * Where to send someone right after a successful sign-in on the storefront
 * /login page — the same rule for every account, admin or not. An admin
 * landing on the normal site by default (not a forced trip to the dashboard)
 * is the point: the dashboard stays one click away via the nav, not the
 * post-login destination.
 *
 * `next` must be a same-site relative path. A bare `startsWith('/')` check
 * isn't enough: `//evil.com` also starts with "/" but browsers resolve it as
 * protocol-relative to an external host, so that (and any absolute URL) is
 * rejected in favor of the safe /account default.
 */
export function resolveLoginRedirect({ next }: ResolveLoginRedirectInput): string {
    if (next && next.startsWith('/') && !next.startsWith('//')) {
        return next;
    }
    return '/account';
}

// Note: Supabase's "User already registered" signup error is deliberately NOT mapped here —
// SignupForm intercepts it before calling this function, so a probing attacker can't tell
// an existing account from a new signup. See SignupForm.tsx's handleSubmit.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
    'Invalid login credentials': 'Incorrect email or password.',
    'Token has expired or is invalid': 'That code is incorrect or has expired. Please request a new one.',
};

/** Maps raw Supabase Auth error messages to storefront-friendly copy. */
export function friendlyAuthError(message: string): string {
    return AUTH_ERROR_MESSAGES[message] ?? 'Something went wrong. Please try again.';
}
