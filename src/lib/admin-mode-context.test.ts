import { describe, it, expect } from 'vitest';
import { resolveAdminModeState } from './admin-mode-context';

describe('resolveAdminModeState', () => {
    it('keeps admin mode off when there is no stored preference yet', () => {
        expect(resolveAdminModeState({ isAdmin: true, storedPreference: false })).toBe(false);
    });

    it('turns admin mode on when an admin has a stored "on" preference', () => {
        expect(resolveAdminModeState({ isAdmin: true, storedPreference: true })).toBe(true);
    });

    it('never lets a stale "on" preference leak to a non-admin account sharing the browser', () => {
        expect(resolveAdminModeState({ isAdmin: false, storedPreference: true })).toBe(false);
    });

    it('stays off for a non-admin with no stored preference', () => {
        expect(resolveAdminModeState({ isAdmin: false, storedPreference: false })).toBe(false);
    });
});
