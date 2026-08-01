import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppEnquiryMessage,
  buildWhatsAppBillMessage,
  buildWhatsAppUrl,
} from './whatsapp';

describe('buildWhatsAppEnquiryMessage', () => {
  it('lists each item with its quantity, politely, with no price anywhere', () => {
    const message = buildWhatsAppEnquiryMessage([
      { name: 'Panda Lamp', quantity: 2 },
      { name: 'Water Keychains', quantity: 1 },
    ]);

    expect(message).toContain('Panda Lamp, Qty 2');
    expect(message).toContain('Water Keychains, Qty 1');
    expect(message).not.toMatch(/₹/);
    expect(message).not.toMatch(/total/i);
  });

  it('includes the variant label alongside the product name when one is set', () => {
    const message = buildWhatsAppEnquiryMessage([
      { name: 'Cat Eye Press-on Nails', quantity: 2, variantLabel: 'Blue' },
    ]);
    expect(message).toContain('Cat Eye Press-on Nails (Blue), Qty 2');
  });

  it('omits the variant parentheses entirely when a line has no variant (failure case the old message never handled)', () => {
    const message = buildWhatsAppEnquiryMessage([{ name: 'Cupcake Beauty Blender', quantity: 1 }]);
    expect(message).toContain('Cupcake Beauty Blender, Qty 1');
    expect(message).not.toContain('()');
  });

  it('includes a single item correctly (boundary case)', () => {
    const message = buildWhatsAppEnquiryMessage([{ name: 'Mirrors', quantity: 1 }]);
    expect(message).toContain('Mirrors, Qty 1');
  });

  it('falls back to a generic greeting for an empty cart (edge case)', () => {
    const message = buildWhatsAppEnquiryMessage([]);
    expect(message).toBe("Hi! I'd like to enquire about some products from Charm Avenue.");
  });

  it('opens politely and closes with a thank-you, never includes delivery details', () => {
    const message = buildWhatsAppEnquiryMessage([{ name: 'Panda Lamp', quantity: 1 }]);
    expect(message).toMatch(/^Hi! I'd like to enquire about:/);
    expect(message).toContain('Thank you!');
    expect(message).not.toContain('Name:');
    expect(message).not.toContain('Phone:');
    expect(message).not.toContain('Address:');
  });
});

describe('buildWhatsAppBillMessage', () => {
  it('lists each item with quantity and price, and includes the total', () => {
    const message = buildWhatsAppBillMessage(
      'abcd1234-ef56-7890-abcd-ef1234567890',
      [
        { name: 'Panda Lamp', quantity: 2, unitPrice: 300 },
        { name: 'Water Keychains', quantity: 1, unitPrice: 150 },
      ],
      750
    );

    expect(message).toContain('Panda Lamp x2 - ₹600');
    expect(message).toContain('Water Keychains x1 - ₹150');
    expect(message).toContain('Total: ₹750');
    expect(message).toContain('#abcd1234');
  });

  it('includes the variant label alongside the product name when one is set', () => {
    const message = buildWhatsAppBillMessage(
      'abcd1234-ef56-7890-abcd-ef1234567890',
      [{ name: 'Cat Eye Press-on Nails', quantity: 2, unitPrice: 200, variantLabel: 'Blue' }],
      400
    );
    expect(message).toContain('Cat Eye Press-on Nails (Blue) x2 - ₹400');
  });

  it('includes the combo discount line only when a discount was applied', () => {
    const withDiscount = buildWhatsAppBillMessage(
      'abcd1234-ef56-7890-abcd-ef1234567890',
      [{ name: 'Mirrors', quantity: 1, unitPrice: 500 }],
      450,
      50
    );
    expect(withDiscount).toContain('Combo discount: -₹50');

    const withoutDiscount = buildWhatsAppBillMessage(
      'abcd1234-ef56-7890-abcd-ef1234567890',
      [{ name: 'Mirrors', quantity: 1, unitPrice: 500 }],
      500
    );
    expect(withoutDiscount).not.toContain('Combo discount');
  });

  it('opens with a bill greeting and closes with a thank-you', () => {
    const message = buildWhatsAppBillMessage(
      'abcd1234-ef56-7890-abcd-ef1234567890',
      [{ name: 'Panda Lamp', quantity: 1, unitPrice: 300 }],
      300
    );
    expect(message).toMatch(/^Hi! Here's your bill for order #abcd1234:/);
    expect(message).toContain('Thank you for shopping with Charm Avenue!');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds a wa.me link with digits-only phone and an encoded message', () => {
    const url = buildWhatsAppUrl('918957298041', 'Hi there');
    expect(url).toBe('https://wa.me/918957298041?text=Hi%20there');
  });

  it('strips non-digit characters from a phone number with + and spaces (failure case for a naive implementation)', () => {
    const url = buildWhatsAppUrl('+91 89572 98041', 'Hi');
    expect(url).toBe('https://wa.me/918957298041?text=Hi');
  });

  it('encodes special characters and newlines in the message', () => {
    const url = buildWhatsAppUrl('918957298041', 'Line one\nLine two & more');
    expect(url).toBe('https://wa.me/918957298041?text=Line%20one%0ALine%20two%20%26%20more');
  });
});
