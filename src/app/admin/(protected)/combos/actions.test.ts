import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCombo, updateCombo, toggleComboActive, deleteCombo } from './actions';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();
const combosInsertSelectSingleMock = vi.fn();
const combosUpdateEqMock = vi.fn();
const combosDeleteEqMock = vi.fn();
const comboProductsInsertMock = vi.fn();
const comboProductsDeleteEqMock = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: { getUser: getUserMock },
        from: (table: string) => {
            if (table === 'profiles') {
                return { select: () => ({ eq: () => ({ single: profileSingleMock }) }) };
            }
            if (table === 'combo_products') {
                return {
                    insert: comboProductsInsertMock,
                    delete: () => ({ eq: comboProductsDeleteEqMock }),
                };
            }
            // 'combos'
            return {
                insert: () => ({ select: () => ({ single: combosInsertSelectSingleMock }) }),
                update: () => ({ eq: combosUpdateEqMock }),
                delete: () => ({ eq: combosDeleteEqMock }),
            };
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
    combosInsertSelectSingleMock.mockReset();
    combosUpdateEqMock.mockReset();
    combosDeleteEqMock.mockReset();
    comboProductsInsertMock.mockReset();
    comboProductsDeleteEqMock.mockReset();

    combosInsertSelectSingleMock.mockResolvedValue({ data: { id: 'combo-1' }, error: null });
    combosUpdateEqMock.mockResolvedValue({ error: null });
    combosDeleteEqMock.mockResolvedValue({ error: null });
    comboProductsInsertMock.mockResolvedValue({ error: null });
    comboProductsDeleteEqMock.mockResolvedValue({ error: null });
});

function comboFormData(overrides: Record<string, string> = {}, productIds: string[] = ['p1', 'p2']) {
    const fd = new FormData();
    fd.set('name', overrides.name ?? 'Earrings + Necklace');
    fd.set('description', overrides.description ?? '');
    fd.set('discountPercent', overrides.discountPercent ?? '10');
    productIds.forEach((id) => fd.append('productIds', id));
    return fd;
}

describe('createCombo — admin-only enforcement', () => {
    it('rejects a logged-out caller and never inserts a row (vulnerability case)', async () => {
        mockLoggedOut();
        await expect(createCombo(comboFormData())).rejects.toThrow(/admin/i);
        expect(combosInsertSelectSingleMock).not.toHaveBeenCalled();
    });

    it('rejects a logged-in non-admin caller (vulnerability case)', async () => {
        mockNonAdmin();
        await expect(createCombo(comboFormData())).rejects.toThrow(/admin/i);
        expect(combosInsertSelectSingleMock).not.toHaveBeenCalled();
    });
});

describe('createCombo', () => {
    it('rejects an empty name without touching the database (failure case)', async () => {
        mockAdmin();
        await expect(createCombo(comboFormData({ name: '   ' }))).rejects.toThrow();
        expect(combosInsertSelectSingleMock).not.toHaveBeenCalled();
    });

    it('rejects a discount percent of 0 or below (failure case)', async () => {
        mockAdmin();
        await expect(createCombo(comboFormData({ discountPercent: '0' }))).rejects.toThrow();
        expect(combosInsertSelectSingleMock).not.toHaveBeenCalled();
    });

    it('rejects a discount percent over 100 (failure case)', async () => {
        mockAdmin();
        await expect(createCombo(comboFormData({ discountPercent: '150' }))).rejects.toThrow();
        expect(combosInsertSelectSingleMock).not.toHaveBeenCalled();
    });

    it('rejects fewer than 2 selected products (failure case)', async () => {
        mockAdmin();
        await expect(createCombo(comboFormData({}, ['p1']))).rejects.toThrow(/at least 2/i);
        expect(combosInsertSelectSingleMock).not.toHaveBeenCalled();
    });

    it('creates the combo row and links every selected product', async () => {
        mockAdmin();
        await createCombo(comboFormData({ name: 'Earrings + Necklace', discountPercent: '10' }, ['p1', 'p2']));

        expect(comboProductsInsertMock).toHaveBeenCalledWith([
            { combo_id: 'combo-1', product_id: 'p1' },
            { combo_id: 'combo-1', product_id: 'p2' },
        ]);
    });
});

describe('updateCombo — admin-only enforcement', () => {
    it('rejects a logged-out caller (vulnerability case)', async () => {
        mockLoggedOut();
        await expect(updateCombo('combo-1', comboFormData())).rejects.toThrow(/admin/i);
        expect(combosUpdateEqMock).not.toHaveBeenCalled();
    });
});

describe('updateCombo', () => {
    it('rejects fewer than 2 selected products (failure case)', async () => {
        mockAdmin();
        await expect(updateCombo('combo-1', comboFormData({}, ['p1']))).rejects.toThrow(/at least 2/i);
        expect(combosUpdateEqMock).not.toHaveBeenCalled();
    });

    it('replaces the product list wholesale rather than diffing', async () => {
        mockAdmin();
        await updateCombo('combo-1', comboFormData({}, ['p2', 'p3']));

        expect(comboProductsDeleteEqMock).toHaveBeenCalledWith('combo_id', 'combo-1');
        expect(comboProductsInsertMock).toHaveBeenCalledWith([
            { combo_id: 'combo-1', product_id: 'p2' },
            { combo_id: 'combo-1', product_id: 'p3' },
        ]);
    });
});

describe('toggleComboActive — admin-only enforcement', () => {
    it('rejects a logged-out caller (vulnerability case)', async () => {
        mockLoggedOut();
        await expect(toggleComboActive('combo-1', false)).rejects.toThrow(/admin/i);
        expect(combosUpdateEqMock).not.toHaveBeenCalled();
    });
});

describe('toggleComboActive', () => {
    it('updates is_active by id', async () => {
        mockAdmin();
        await toggleComboActive('combo-1', false);
        expect(combosUpdateEqMock).toHaveBeenCalledWith('id', 'combo-1');
    });
});

describe('deleteCombo — admin-only enforcement', () => {
    it('rejects a logged-out caller (vulnerability case)', async () => {
        mockLoggedOut();
        await expect(deleteCombo('combo-1')).rejects.toThrow(/admin/i);
        expect(combosDeleteEqMock).not.toHaveBeenCalled();
    });
});

describe('deleteCombo', () => {
    it('deletes the combo by id (combo_products cascade via FK)', async () => {
        mockAdmin();
        await deleteCombo('combo-1');
        expect(combosDeleteEqMock).toHaveBeenCalledWith('id', 'combo-1');
    });
});
