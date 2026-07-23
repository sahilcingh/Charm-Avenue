import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWhatsAppEnquiry } from './actions';

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

const items = [{ productId: 'p1', productName: 'Panda Lamp', unitPrice: 130, quantity: 2 }];
const validContact = { name: 'Priya Sharma', phone: '9876543210', address: '' };

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

  mockLoggedOut();
  ordersInsertMock.mockResolvedValue({ error: null });
  orderItemsInsertMock.mockResolvedValue({ error: null });
});

describe('createWhatsAppEnquiry', () => {
  it('rejects an empty cart (edge case)', async () => {
    const result = await createWhatsAppEnquiry([], validContact);
    expect(result.error).toBeTruthy();
    expect(ordersInsertMock).not.toHaveBeenCalled();
  });

  it('rejects a missing name, without touching the database (server-side, defense in depth)', async () => {
    const result = await createWhatsAppEnquiry(items, { ...validContact, name: '  ' });
    expect(result.error).toBeTruthy();
    expect(ordersInsertMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid phone number, without touching the database (server-side, defense in depth)', async () => {
    const result = await createWhatsAppEnquiry(items, { ...validContact, phone: '123' });
    expect(result.error).toBeTruthy();
    expect(ordersInsertMock).not.toHaveBeenCalled();
  });

  it('accepts a blank address — it is optional', async () => {
    const result = await createWhatsAppEnquiry(items, { ...validContact, address: '' });
    expect(result.error).toBeUndefined();
  });

  it('works without being logged in, saving user_id as null (guest enquiry)', async () => {
    mockLoggedOut();
    const result = await createWhatsAppEnquiry(items, validContact);

    expect(result.error).toBeUndefined();
    expect(result.orderId).toMatch(UUID_PATTERN);
    expect(result.whatsappUrl).toContain('wa.me');
    expect(ordersInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: result.orderId, user_id: null, status: 'pending_whatsapp' })
    );
  });

  it('sets user_id when the customer is logged in, so it still shows in their Account order history', async () => {
    mockLoggedIn('user-42');
    const result = await createWhatsAppEnquiry(items, validContact);

    expect(result.error).toBeUndefined();
    expect(ordersInsertMock).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-42' }));
  });

  it('saves the provided name/phone/address as guest_name/guest_phone/guest_address', async () => {
    mockLoggedOut();
    await createWhatsAppEnquiry(items, {
      name: 'Priya Sharma',
      phone: '9876543210',
      address: '221B Baker Colony, Mumbai',
    });

    expect(ordersInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        guest_name: 'Priya Sharma',
        guest_phone: '9876543210',
        guest_address: '221B Baker Colony, Mumbai',
      })
    );
  });

  it('saves guest_address as null when left blank (optional field)', async () => {
    mockLoggedOut();
    await createWhatsAppEnquiry(items, { ...validContact, address: '' });

    expect(ordersInsertMock).toHaveBeenCalledWith(expect.objectContaining({ guest_address: null }));
  });

  it('builds a product-only WhatsApp URL — name/phone/address are for admin tracking, not the message', async () => {
    mockLoggedOut();
    const result = await createWhatsAppEnquiry(items, validContact);
    const decoded = decodeURIComponent(result.whatsappUrl ?? '');

    expect(decoded).toContain('Panda Lamp x2');
    expect(decoded).toContain('Total: ₹260');
    expect(decoded).not.toContain('Priya Sharma');
    expect(decoded).not.toContain(validContact.phone);
  });

  it('defaults discount_total to 0 and stores the full items subtotal when no discount is passed', async () => {
    mockLoggedOut();
    await createWhatsAppEnquiry(items, validContact);

    expect(ordersInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 260, discount_total: 0 })
    );
  });

  it('subtracts a combo discount from the stored subtotal, saves discount_total, and reflects it in the WhatsApp message', async () => {
    mockLoggedOut();
    const result = await createWhatsAppEnquiry(items, validContact, 50);

    expect(ordersInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 210, discount_total: 50 })
    );
    const decoded = decodeURIComponent(result.whatsappUrl ?? '');
    expect(decoded).toContain('Combo discount: -₹50');
    expect(decoded).toContain('Total: ₹210');
  });

  it('snapshots variant_id/variant_label/variant_image/personalization_text when a line item has them', async () => {
    mockLoggedOut();
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

    await createWhatsAppEnquiry(itemsWithVariant, validContact);

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
    mockLoggedOut();
    await createWhatsAppEnquiry(items, validContact);

    expect(orderItemsInsertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        variant_id: null,
        variant_label: null,
        variant_image: null,
        personalization_text: null,
      }),
    ]);
  });

  it('reports an error (and logs it) instead of attempting a delete-rollback if saving line items fails — no DELETE policy exists on orders for any role', async () => {
    mockLoggedOut();
    orderItemsInsertMock.mockResolvedValue({ error: { message: 'insert failed' } });

    const result = await createWhatsAppEnquiry(items, validContact);

    expect(result.error).toBeTruthy();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('reports an error and does not proceed if the order itself fails to create', async () => {
    mockLoggedOut();
    ordersInsertMock.mockResolvedValue({ error: { message: 'db down' } });

    const result = await createWhatsAppEnquiry(items, validContact);

    expect(result.error).toBeTruthy();
    expect(orderItemsInsertMock).not.toHaveBeenCalled();
  });
});
