import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateContactInfo } from './actions';

const getUserMock = vi.fn();
const profilesUpdateEqMock = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: () => ({ update: () => ({ eq: profilesUpdateEqMock }) }),
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  profilesUpdateEqMock.mockReset();
  profilesUpdateEqMock.mockResolvedValue({ error: null });
});

describe('updateContactInfo', () => {
  it('rejects when not signed in (failure case)', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const result = await updateContactInfo('9876543210', '221B Baker Colony, Mumbai');
    expect(result.error).toBeTruthy();
    expect(profilesUpdateEqMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid phone number without touching the database', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const result = await updateContactInfo('123', '221B Baker Colony, Mumbai');
    expect(result.error).toBeTruthy();
    expect(profilesUpdateEqMock).not.toHaveBeenCalled();
  });

  it('saves a valid phone and address for the signed-in user', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const result = await updateContactInfo('9876543210', '221B Baker Colony, Mumbai');
    expect(result.error).toBeNull();
    expect(profilesUpdateEqMock).toHaveBeenCalledWith('id', 'user-1');
  });

  it('allows clearing both fields back to blank (edge case)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const result = await updateContactInfo('', '');
    expect(result.error).toBeNull();
  });
});
