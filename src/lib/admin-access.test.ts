import { describe, it, expect } from 'vitest';
import { decideAdminAccess } from './admin-access';

describe('decideAdminAccess', () => {
    it('lets a request through untouched on a non-admin path', () => {
        expect(decideAdminAccess({ pathname: '/shop', isLoggedIn: false, isAdmin: false })).toEqual({ action: 'next' });
    });

    it('redirects a logged-out visitor away from a protected admin route to the single unified login page, remembering where they were headed', () => {
        expect(decideAdminAccess({ pathname: '/admin/products', isLoggedIn: false, isAdmin: false })).toEqual({
            action: 'redirect',
            redirectTo: '/login?next=%2Fadmin%2Fproducts',
        });
    });

    it('redirects a logged-in non-admin customer away from a protected admin route (the core security fix)', () => {
        expect(decideAdminAccess({ pathname: '/admin/products', isLoggedIn: true, isAdmin: false })).toEqual({
            action: 'redirect',
            redirectTo: '/',
        });
    });

    it('lets a logged-in admin through to a protected admin route', () => {
        expect(decideAdminAccess({ pathname: '/admin/products', isLoggedIn: true, isAdmin: true })).toEqual({ action: 'next' });
    });

    it('treats a nested admin sub-route the same as the top-level one', () => {
        expect(decideAdminAccess({ pathname: '/admin/products/123', isLoggedIn: true, isAdmin: false })).toEqual({
            action: 'redirect',
            redirectTo: '/',
        });
    });

    it('encodes special characters in the remembered next path (failure case: an unencoded next could break the query string)', () => {
        expect(decideAdminAccess({ pathname: '/admin/products?tab=drafts', isLoggedIn: false, isAdmin: false })).toEqual({
            action: 'redirect',
            redirectTo: '/login?next=%2Fadmin%2Fproducts%3Ftab%3Ddrafts',
        });
    });

    it('redirects a logged-out visitor away from the bare /admin path too', () => {
        expect(decideAdminAccess({ pathname: '/admin', isLoggedIn: false, isAdmin: false })).toEqual({
            action: 'redirect',
            redirectTo: '/login?next=%2Fadmin',
        });
    });
});
