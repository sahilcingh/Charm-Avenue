import { describe, it, expect } from 'vitest';
import { isValidEmail, validatePassword, validateSignupForm, validateLoginForm, getInitial, friendlyAuthError, resolveLoginRedirect, validateOtp } from './auth-validation';

describe('isValidEmail', () => {
    it('accepts a normal email', () => {
        expect(isValidEmail('nandini@charmavenue.in')).toBe(true);
    });

    it('rejects an email with no @', () => {
        expect(isValidEmail('nandinicharmavenue.in')).toBe(false);
    });

    it('rejects an email with no domain', () => {
        expect(isValidEmail('nandini@')).toBe(false);
    });

    it('rejects an empty string', () => {
        expect(isValidEmail('')).toBe(false);
    });

    it('rejects whitespace-only input', () => {
        expect(isValidEmail('   ')).toBe(false);
    });
});

describe('validatePassword', () => {
    it('accepts a 6+ character password', () => {
        expect(validatePassword('secret1')).toBeNull();
    });

    it('rejects a password shorter than 6 characters', () => {
        expect(validatePassword('abc12')).toBe('Password must be at least 6 characters.');
    });

    it('rejects an empty password', () => {
        expect(validatePassword('')).toBe('Password must be at least 6 characters.');
    });

    it('accepts a password that is exactly 6 characters (boundary)', () => {
        expect(validatePassword('abcdef')).toBeNull();
    });
});

describe('validateSignupForm', () => {
    const validInput = { name: 'Nandini', email: 'nandini@charmavenue.in', password: 'secret1', confirmPassword: 'secret1' };

    it('returns no errors for fully valid input', () => {
        expect(validateSignupForm(validInput)).toEqual({});
    });

    it('flags an empty name', () => {
        const errors = validateSignupForm({ ...validInput, name: '  ' });
        expect(errors.name).toBeDefined();
    });

    it('flags an invalid email', () => {
        const errors = validateSignupForm({ ...validInput, email: 'not-an-email' });
        expect(errors.email).toBeDefined();
    });

    it('flags a too-short password', () => {
        const errors = validateSignupForm({ ...validInput, password: 'abc', confirmPassword: 'abc' });
        expect(errors.password).toBeDefined();
    });

    it('flags mismatched confirm-password', () => {
        const errors = validateSignupForm({ ...validInput, confirmPassword: 'different1' });
        expect(errors.confirmPassword).toBeDefined();
    });

    it('flags every field at once when all are empty (failure case)', () => {
        const errors = validateSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
        expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'email', 'name', 'password']);
    });
});

describe('validateLoginForm', () => {
    it('returns no errors for valid input', () => {
        expect(validateLoginForm({ email: 'nandini@charmavenue.in', password: 'secret1' })).toEqual({});
    });

    it('flags a missing email', () => {
        const errors = validateLoginForm({ email: '', password: 'secret1' });
        expect(errors.email).toBeDefined();
    });

    it('flags a missing password without enforcing the 6-char rule (login just needs "something")', () => {
        const errors = validateLoginForm({ email: 'nandini@charmavenue.in', password: '' });
        expect(errors.password).toBeDefined();
    });
});

describe('getInitial', () => {
    it('returns the uppercased first letter of a name', () => {
        expect(getInitial('nandini')).toBe('N');
    });

    it('returns the uppercased first letter of an email when no name is given', () => {
        expect(getInitial('nandini@charmavenue.in')).toBe('N');
    });

    it('falls back to a placeholder for empty input', () => {
        expect(getInitial('')).toBe('?');
    });

    it('falls back to a placeholder for whitespace-only input', () => {
        expect(getInitial('   ')).toBe('?');
    });
});

describe('validateOtp', () => {
    it('accepts a 6-digit code', () => {
        expect(validateOtp('123456')).toBeNull();
    });

    it('rejects a code shorter than 6 digits', () => {
        expect(validateOtp('123')).toBe('Enter the 6-digit code from your email.');
    });

    it('rejects a code longer than 6 digits', () => {
        expect(validateOtp('1234567')).toBe('Enter the 6-digit code from your email.');
    });

    it('rejects a code containing non-digit characters', () => {
        expect(validateOtp('12a456')).toBe('Enter the 6-digit code from your email.');
    });

    it('rejects an empty code (failure case)', () => {
        expect(validateOtp('')).toBe('Enter the 6-digit code from your email.');
    });

    it('trims surrounding whitespace before validating', () => {
        expect(validateOtp('  123456  ')).toBeNull();
    });
});

describe('resolveLoginRedirect', () => {
    it('sends anyone to their requested page when next is a normal relative path (admin and non-admin follow the same rule)', () => {
        expect(resolveLoginRedirect({ next: '/cart' })).toBe('/cart');
    });

    it('sends someone bounced from the admin dashboard back to it, since that reflects their own prior request', () => {
        expect(resolveLoginRedirect({ next: '/admin/products' })).toBe('/admin/products');
    });

    it('falls back to /account with no next param', () => {
        expect(resolveLoginRedirect({ next: null })).toBe('/account');
    });

    it('falls back to /account for an empty next param', () => {
        expect(resolveLoginRedirect({ next: '' })).toBe('/account');
    });

    it('rejects a protocol-relative next param as an open-redirect attempt (failure case)', () => {
        expect(resolveLoginRedirect({ next: '//evil.com' })).toBe('/account');
    });

    it('rejects an absolute-URL next param as an open-redirect attempt', () => {
        expect(resolveLoginRedirect({ next: 'https://evil.com' })).toBe('/account');
    });

    it('rejects a next param that does not start with a slash', () => {
        expect(resolveLoginRedirect({ next: 'evil.com' })).toBe('/account');
    });
});

describe('friendlyAuthError', () => {
    it('does NOT map the duplicate-signup Supabase error — SignupForm intercepts it before this is called, to avoid revealing account existence (security case)', () => {
        expect(friendlyAuthError('User already registered')).toBe('Something went wrong. Please try again.');
    });

    it('maps a bad-credentials Supabase error to friendly copy', () => {
        expect(friendlyAuthError('Invalid login credentials')).toBe('Incorrect email or password.');
    });

    it('maps an expired/invalid OTP Supabase error to friendly copy', () => {
        expect(friendlyAuthError('Token has expired or is invalid')).toBe('That code is incorrect or has expired. Please request a new one.');
    });

    it('falls back to a generic message for an unrecognized error', () => {
        expect(friendlyAuthError('some_unmapped_supabase_error')).toBe('Something went wrong. Please try again.');
    });

    it('falls back to a generic message for an empty error string', () => {
        expect(friendlyAuthError('')).toBe('Something went wrong. Please try again.');
    });
});
