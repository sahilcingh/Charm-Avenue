import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWhatsAppOrder, createPaymentOrder } from './actions';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getUserMock = vi.fn();
const ordersInsertMock = vi.fn();
const orderItemsInsertMock = vi.fn();
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('@/lib/supabase/server', () => ({
    createClient: async () => ({
        auth: { getUser: getUserMock },
        from: (table: string) => {
            if (table === 'orders') {
                return { insert: ordersInsertMock };
            }
            // 'order_items'
            return { insert: orderItemsInsertMock };
        },
    }),
}));

const validDetails = { name: 'Priya Sharma', phone: '9876543210', address: '221B Baker Colony, Mumbai' };
const items = [{ productId: 'p1', productName: 'Panda Lamp', unitPrice: 130, quantity: 2 }];

function mockLoggedOut() {
    getUserMock.mockResolvedValue({ data: { user: null } });
}

function mockLoggedIn(id = 'user-1') {
    getUserMock.mockResolvedValue({ data: { user: { id } } });
}

beforeEach(() => {
    getUserMock.mockReset();
    ordersInsertMock.mockReset();
    orderItemsInsertMock.mockReset();
    consoleErrorSpy.mockClear();

    ordersInsertMock.mockResolvedValue({ error: null });
    orderItemsInsertMock.mockResolvedValue({ error: null });
});

describe('createWhatsAppOrder', () => {
    it('rejects an invalid checkout form and never touches the database (failure case)', async () => {
        mockLoggedIn();
        const result = await createWhatsAppOrder({ name: '', phone: '123', address: '' }, items);

        expect(result.error).toBeTruthy();
        expect(ordersInsertMock).not.toHaveBeenCalled();
    });

    it('rejects an empty cart (edge case)', async () => {
        mockLoggedIn();
        const result = await createWhatsAppOrder(validDetails, []);
        expect(result.error).toBeTruthy();
    });

    it('rejects placing an order when not signed in, without touching the database — checkout requires login', async () => {
        mockLoggedOut();
        const result = await createWhatsAppOrder(validDetails, items);

        expect(result.error).toBeTruthy();
        expect(ordersInsertMock).not.toHaveBeenCalled();
    });

    it("creates an order tied to the logged-in user's id with status pending_whatsapp, never relying on a SELECT-gated read-back", async () => {
        mockLoggedIn('user-42');
        const result = await createWhatsAppOrder(validDetails, items);

        expect(result.error).toBeUndefined();
        expect(result.orderId).toMatch(UUID_PATTERN);
        expect(result.whatsappUrl).toContain('wa.me');
        expect(ordersInsertMock).toHaveBeenCalledWith(
            expect.objectContaining({ id: result.orderId, user_id: 'user-42', status: 'pending_whatsapp' })
        );
    });

    it('builds a product-only WhatsApp URL — no name/phone/address, WhatsApp is enquiry-only', async () => {
        mockLoggedIn();
        const result = await createWhatsAppOrder(validDetails, items);
        const decoded = decodeURIComponent(result.whatsappUrl ?? '');

        expect(decoded).toContain('Panda Lamp x2');
        expect(decoded).not.toContain('Priya Sharma');
        expect(decoded).not.toContain(validDetails.phone);
        expect(decoded).not.toContain(validDetails.address);
    });

    it('reports an error (and logs it) instead of attempting a delete-rollback if saving line items fails — no DELETE policy exists on orders for any role', async () => {
        mockLoggedIn();
        orderItemsInsertMock.mockResolvedValue({ error: { message: 'insert failed' } });

        const result = await createWhatsAppOrder(validDetails, items);

        expect(result.error).toBeTruthy();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('reports an error and does not proceed if the order itself fails to create', async () => {
        mockLoggedIn();
        ordersInsertMock.mockResolvedValue({ error: { message: 'db down' } });

        const result = await createWhatsAppOrder(validDetails, items);

        expect(result.error).toBeTruthy();
        expect(orderItemsInsertMock).not.toHaveBeenCalled();
    });

    it('snapshots variant_id/variant_label/variant_image/personalization_text when the line item has them', async () => {
        mockLoggedIn();
        const itemsWithVariant = [
            {
                productId: 'p1',
                productName: 'Panda Lamp',
                unitPrice: 130,
                quantity: 1,
                variantId: 'variant-1',
                variantLabel: 'Red / M',
                variantImage: 'https://example.com/red.jpg',
                personalizationText: 'Add initials: AB',
            },
        ];

        await createWhatsAppOrder(validDetails, itemsWithVariant);

        expect(orderItemsInsertMock).toHaveBeenCalledWith([
            expect.objectContaining({
                variant_id: 'variant-1',
                variant_label: 'Red / M',
                variant_image: 'https://example.com/red.jpg',
                personalization_text: 'Add initials: AB',
            }),
        ]);
    });

    it('leaves variant/personalization columns null for a plain line item without them (unchanged behavior)', async () => {
        mockLoggedIn();
        await createWhatsAppOrder(validDetails, items);

        expect(orderItemsInsertMock).toHaveBeenCalledWith([
            expect.objectContaining({
                variant_id: null,
                variant_label: null,
                variant_image: null,
                personalization_text: null,
            }),
        ]);
    });

    it('defaults discount_total to 0 and stores the full items subtotal when no discount is passed (backward compatible)', async () => {
        mockLoggedIn();
        await createWhatsAppOrder(validDetails, items);

        expect(ordersInsertMock).toHaveBeenCalledWith(expect.objectContaining({ subtotal: 260, discount_total: 0 }));
    });

    it('subtracts a combo discount from the stored subtotal and saves discount_total (Phase 7)', async () => {
        mockLoggedIn();
        await createWhatsAppOrder(validDetails, items, 50);

        expect(ordersInsertMock).toHaveBeenCalledWith(expect.objectContaining({ subtotal: 210, discount_total: 50 }));
    });

    it('includes the combo discount in the WhatsApp message', async () => {
        mockLoggedIn();
        const result = await createWhatsAppOrder(validDetails, items, 50);
        const decoded = decodeURIComponent(result.whatsappUrl ?? '');

        expect(decoded).toContain('Combo discount: -₹50');
        expect(decoded).toContain('Total: ₹210');
    });
});

describe('createPaymentOrder', () => {
    const originalEnv = { ...process.env };
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        process.env.CASHFREE_APP_ID = 'test-app-id';
        process.env.CASHFREE_SECRET_KEY = 'test-secret';
        fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ payment_session_id: 'session-abc' }),
        });
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.unstubAllGlobals();
    });

    it('reports a clear error instead of attempting a payment when Cashfree credentials are not configured', async () => {
        delete process.env.CASHFREE_APP_ID;
        mockLoggedIn();

        const result = await createPaymentOrder(validDetails, items);

        expect(result.error).toBeTruthy();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(ordersInsertMock).not.toHaveBeenCalled();
    });

    it('rejects an invalid checkout form without creating an order or calling Cashfree (failure case)', async () => {
        mockLoggedIn();
        const result = await createPaymentOrder({ name: '', phone: '123', address: '' }, items);

        expect(result.error).toBeTruthy();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects placing an order when not signed in, without touching the database or calling Cashfree — checkout requires login', async () => {
        mockLoggedOut();
        const result = await createPaymentOrder(validDetails, items);

        expect(result.error).toBeTruthy();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(ordersInsertMock).not.toHaveBeenCalled();
    });

    it('creates a pending_payment order (with payment_gateway_order_id set upfront), calls Cashfree, and returns the payment session id on success', async () => {
        mockLoggedIn();
        const result = await createPaymentOrder(validDetails, items);

        expect(result.error).toBeUndefined();
        expect(result.orderId).toMatch(UUID_PATTERN);
        expect(result.paymentSessionId).toBe('session-abc');
        expect(ordersInsertMock).toHaveBeenCalledWith(
            expect.objectContaining({ id: result.orderId, status: 'pending_payment', payment_gateway_order_id: result.orderId })
        );

        const [, requestInit] = fetchMock.mock.calls[0];
        const body = JSON.parse(requestInit.body);
        expect(body.order_id).toBe(result.orderId);
        expect(body.order_amount).toBe(260);
        expect(requestInit.headers['x-client-id']).toBe('test-app-id');
    });

    it('reports an error (and logs it) if Cashfree rejects the request — the order is left as-is, not deleted (no delete policy exists)', async () => {
        mockLoggedIn();
        fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

        const result = await createPaymentOrder(validDetails, items);

        expect(result.error).toBeTruthy();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('charges Cashfree the discounted amount and stores discount_total, so a combo discount is never bypassed on the paid path (Phase 7)', async () => {
        mockLoggedIn();
        const result = await createPaymentOrder(validDetails, items, 50);

        expect(ordersInsertMock).toHaveBeenCalledWith(expect.objectContaining({ subtotal: 210, discount_total: 50 }));
        const [, requestInit] = fetchMock.mock.calls[0];
        const body = JSON.parse(requestInit.body);
        expect(body.order_amount).toBe(210);
        expect(result.error).toBeUndefined();
    });
});
