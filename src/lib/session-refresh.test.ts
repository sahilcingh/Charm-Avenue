import { describe, it, expect } from 'vitest';
import { shouldCheckSession } from './session-refresh';

describe('shouldCheckSession', () => {
    it('always checks admin routes, even with no session cookie present', () => {
        expect(shouldCheckSession({ pathname: '/admin/products', hasSupabaseCookie: false })).toBe(true);
    });

    it('checks admin routes when a session cookie is present too', () => {
        expect(shouldCheckSession({ pathname: '/admin/products', hasSupabaseCookie: true })).toBe(true);
    });

    it('skips a non-admin route with no session cookie (genuinely anonymous visitor — nothing to refresh)', () => {
        expect(shouldCheckSession({ pathname: '/account', hasSupabaseCookie: false })).toBe(false);
    });

    it('checks a non-admin route when a session cookie IS present (regression case: logged-in customer session must still refresh)', () => {
        expect(shouldCheckSession({ pathname: '/account', hasSupabaseCookie: true })).toBe(true);
    });

    it('skips the homepage with no session cookie', () => {
        expect(shouldCheckSession({ pathname: '/', hasSupabaseCookie: false })).toBe(false);
    });
});
