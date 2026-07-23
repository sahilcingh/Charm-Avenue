import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin } from './require-admin';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: () => ({ select: () => ({ eq: () => ({ single: profileSingleMock }) }) }),
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  profileSingleMock.mockReset();
});

describe('requireAdmin', () => {
  it('throws for a logged-out caller (failure case)', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(requireAdmin()).rejects.toThrow('You must be signed in as an admin to do this.');
  });

  it('throws for a logged-in non-admin caller', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'customer-1' } } });
    profileSingleMock.mockResolvedValue({ data: { is_admin: false } });
    await expect(requireAdmin()).rejects.toThrow('You must be an admin to do this.');
  });

  it('throws when the profile row is missing entirely (edge case: no profile row for this user)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'ghost-1' } } });
    profileSingleMock.mockResolvedValue({ data: null });
    await expect(requireAdmin()).rejects.toThrow('You must be an admin to do this.');
  });

  it('resolves with the user for a logged-in admin (normal case)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    profileSingleMock.mockResolvedValue({ data: { is_admin: true } });

    const result = await requireAdmin();
    expect(result.user).toEqual({ id: 'admin-1' });
  });
});
