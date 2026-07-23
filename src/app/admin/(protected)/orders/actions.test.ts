import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateOrderStatus } from './actions';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();
const ordersUpdateEqMock = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: { getUser: getUserMock },
        from: (table: string) => {
            if (table === 'profiles') {
                return { select: () => ({ eq: () => ({ single: profileSingleMock }) }) };
            }
            // 'orders'
            return { update: () => ({ eq: ordersUpdateEqMock }) };
        },
    }),
}));

function mockLoggedOut() {
    getUserMock.mockResolvedValue({ data: { user: null } });
}

function mockNonAdmin() {
    getUserMock.mockResolvedValue({ data: { user: { id: 'customer-1' } } });
    profileSingleMock.mockResolvedValue({ data: { is_admin: false } });
}

function mockAdmin() {
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    profileSingleMock.mockResolvedValue({ data: { is_admin: true } });
}

beforeEach(() => {
    getUserMock.mockReset();
    profileSingleMock.mockReset();
    ordersUpdateEqMock.mockReset();
    ordersUpdateEqMock.mockResolvedValue({ error: null });
});

describe('updateOrderStatus — admin-only enforcement', () => {
    it('rejects a logged-out caller and never updates a row (vulnerability case)', async () => {
        mockLoggedOut();
        await expect(updateOrderStatus('order-1', 'paid')).rejects.toThrow(/admin/i);
        expect(ordersUpdateEqMock).not.toHaveBeenCalled();
    });

    it('rejects a logged-in non-admin caller and never updates a row (vulnerability case)', async () => {
        mockNonAdmin();
        await expect(updateOrderStatus('order-1', 'paid')).rejects.toThrow(/admin/i);
        expect(ordersUpdateEqMock).not.toHaveBeenCalled();
    });

    it("rejects a status that isn't one of the known values, even for an admin (failure case)", async () => {
        mockAdmin();
        // @ts-expect-error deliberately invalid at the type level too
        await expect(updateOrderStatus('order-1', 'shipped')).rejects.toThrow(/invalid/i);
        expect(ordersUpdateEqMock).not.toHaveBeenCalled();
    });

    it('allows a logged-in admin to update an order to a valid status (normal case)', async () => {
        mockAdmin();
        await expect(updateOrderStatus('order-1', 'paid')).resolves.toBeUndefined();
        expect(ordersUpdateEqMock).toHaveBeenCalledWith('id', 'order-1');
    });
});
