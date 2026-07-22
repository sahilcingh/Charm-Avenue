import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProduct, updateProduct, deleteProduct } from './actions';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();
const productsInsertMock = vi.fn();
const productsInsertSelectSingleMock = vi.fn();
const productsUpdateEqMock = vi.fn();
const productsDeleteEqMock = vi.fn();
const productsSlugMaybeSingleMock = vi.fn();
const auditInsertMock = vi.fn();
const storageUploadMock = vi.fn();
const storageGetPublicUrlMock = vi.fn();

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: { getUser: getUserMock },
        storage: {
            from: () => ({
                upload: storageUploadMock,
                getPublicUrl: storageGetPublicUrlMock,
            }),
        },
        from: (table: string) => {
            if (table === 'profiles') {
                return { select: () => ({ eq: () => ({ single: profileSingleMock }) }) };
            }
            if (table === 'admin_audit_log') {
                return { insert: auditInsertMock };
            }
            // 'products'
            return {
                insert: productsInsertMock,
                update: () => ({ eq: productsUpdateEqMock }),
                delete: () => ({ eq: productsDeleteEqMock }),
                select: () => ({ eq: () => ({ maybeSingle: productsSlugMaybeSingleMock }) }),
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

// A minimal-but-complete form, valid enough that if the admin check were
// bypassed, the action would sail through the rest of its own logic.
function validProductFormData() {
    const fd = new FormData();
    fd.set('name', 'Sneaky Product');
    fd.set('categorySlug', 'accessories');
    fd.set('price', '100');
    fd.set('imageAlt', 'alt');
    fd.set('tagStyle', 'none');
    fd.set('emoji', '✨');
    fd.set('description', 'desc');
    fd.set('rating', '4.5');
    fd.set('reviewCount', '0');
    fd.set('isActive', 'on');
    fd.set('imageFile', new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' }));
    return fd;
}

beforeEach(() => {
    getUserMock.mockReset();
    profileSingleMock.mockReset();
    productsInsertMock.mockReset();
    productsInsertSelectSingleMock.mockReset();
    productsUpdateEqMock.mockReset();
    productsDeleteEqMock.mockReset();
    productsSlugMaybeSingleMock.mockReset();
    auditInsertMock.mockReset();
    storageUploadMock.mockReset();
    storageGetPublicUrlMock.mockReset();

    productsInsertMock.mockReturnValue({ select: () => ({ single: productsInsertSelectSingleMock }) });
    productsInsertSelectSingleMock.mockResolvedValue({ data: { id: 'new-product-id' }, error: null });
    productsUpdateEqMock.mockResolvedValue({ error: null });
    productsDeleteEqMock.mockResolvedValue({ error: null });
    productsSlugMaybeSingleMock.mockResolvedValue({ data: null });
    auditInsertMock.mockResolvedValue({ error: null });
    storageUploadMock.mockResolvedValue({ error: null });
    storageGetPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });
});

describe('deleteProduct — admin-only enforcement', () => {
    it('rejects a logged-out caller and never touches the database (vulnerability case)', async () => {
        mockLoggedOut();
        await expect(deleteProduct('p1', 'Panda Lamp')).rejects.toThrow(/admin/i);
        expect(productsDeleteEqMock).not.toHaveBeenCalled();
    });

    it('rejects a logged-in non-admin caller and never touches the database (vulnerability case)', async () => {
        mockNonAdmin();
        await expect(deleteProduct('p1', 'Panda Lamp')).rejects.toThrow(/admin/i);
        expect(productsDeleteEqMock).not.toHaveBeenCalled();
    });

    it('allows a logged-in admin to delete a product (normal case, behavior preserved)', async () => {
        mockAdmin();
        await expect(deleteProduct('p1', 'Panda Lamp')).resolves.toBeUndefined();
        expect(productsDeleteEqMock).toHaveBeenCalledWith('id', 'p1');
    });
});

describe('createProduct — admin-only enforcement', () => {
    it('rejects a logged-out caller and never inserts a row (vulnerability case)', async () => {
        mockLoggedOut();
        await expect(createProduct(validProductFormData())).rejects.toThrow(/admin/i);
        expect(productsInsertMock).not.toHaveBeenCalled();
    });

    it('rejects a logged-in non-admin caller and never inserts a row (vulnerability case)', async () => {
        mockNonAdmin();
        await expect(createProduct(validProductFormData())).rejects.toThrow(/admin/i);
        expect(productsInsertMock).not.toHaveBeenCalled();
    });
});

describe('updateProduct — admin-only enforcement', () => {
    it('rejects a logged-out caller and never updates a row (vulnerability case)', async () => {
        mockLoggedOut();
        await expect(updateProduct('p1', validProductFormData())).rejects.toThrow(/admin/i);
        expect(productsUpdateEqMock).not.toHaveBeenCalled();
    });

    it('rejects a logged-in non-admin caller and never updates a row (vulnerability case)', async () => {
        mockNonAdmin();
        await expect(updateProduct('p1', validProductFormData())).rejects.toThrow(/admin/i);
        expect(productsUpdateEqMock).not.toHaveBeenCalled();
    });
});

describe('admin action audit trail', () => {
    it('logs who created a product, and with what id/name (normal case)', async () => {
        mockAdmin();
        await createProduct(validProductFormData());

        expect(auditInsertMock).toHaveBeenCalledWith({
            admin_id: 'admin-1',
            action: 'create',
            product_id: 'new-product-id',
            product_name: 'Sneaky Product',
        });
    });

    it('logs who updated a product, and which one', async () => {
        mockAdmin();
        await updateProduct('p1', validProductFormData());

        expect(auditInsertMock).toHaveBeenCalledWith({
            admin_id: 'admin-1',
            action: 'update',
            product_id: 'p1',
            product_name: 'Sneaky Product',
        });
    });

    it('logs who deleted a product, and which one', async () => {
        mockAdmin();
        await deleteProduct('p1', 'Panda Lamp');

        expect(auditInsertMock).toHaveBeenCalledWith({
            admin_id: 'admin-1',
            action: 'delete',
            product_id: 'p1',
            product_name: 'Panda Lamp',
        });
    });

    it('does not log anything for a rejected (non-admin) attempt', async () => {
        mockNonAdmin();
        await expect(deleteProduct('p1', 'Panda Lamp')).rejects.toThrow();
        expect(auditInsertMock).not.toHaveBeenCalled();
    });

    it('a failing audit-log write does not block the actual product mutation from succeeding (failure case)', async () => {
        mockAdmin();
        auditInsertMock.mockResolvedValue({ error: { message: 'audit table unavailable' } });

        await expect(deleteProduct('p1', 'Panda Lamp')).resolves.toBeUndefined();
        expect(productsDeleteEqMock).toHaveBeenCalledWith('id', 'p1');
    });
});
