import { describe, it, expect } from 'vitest';
import { buildWhatsAppEnquiryMessage, buildWhatsAppUrl } from './whatsapp';

describe('buildWhatsAppEnquiryMessage', () => {
  it('lists each item with quantity and line total, plus a grand total', () => {
    const message = buildWhatsAppEnquiryMessage([
      { name: 'Panda Lamp', quantity: 2, price: 130 },
      { name: 'Water Keychains', quantity: 1, price: 150 },
    ]);

    expect(message).toContain('Panda Lamp x2 - ₹260');
    expect(message).toContain('Water Keychains x1 - ₹150');
    expect(message).toContain('Total: ₹410');
  });

  it('includes a single item correctly (boundary case)', () => {
    const message = buildWhatsAppEnquiryMessage([{ name: 'Mirrors', quantity: 1, price: 120 }]);
    expect(message).toContain('Mirrors x1 - ₹120');
    expect(message).toContain('Total: ₹120');
  });

  it('falls back to a generic greeting for an empty cart (edge case)', () => {
    const message = buildWhatsAppEnquiryMessage([]);
    expect(message).toBe("Hi! I'd like to enquire about some products from Charm Avenue.");
  });

  it('never includes delivery details — WhatsApp is product enquiry only, order/delivery info lives in the orders table', () => {
    const message = buildWhatsAppEnquiryMessage([{ name: 'Panda Lamp', quantity: 1, price: 130 }]);
    expect(message).not.toContain('Name:');
    expect(message).not.toContain('Phone:');
    expect(message).not.toContain('Address:');
  });

  it('subtracts a combo discount from the grand total and shows it as its own line (Phase 7)', () => {
    const message = buildWhatsAppEnquiryMessage(
      [
        { name: 'Earrings', quantity: 1, price: 200 },
        { name: 'Necklace', quantity: 1, price: 300 },
      ],
      50
    );
    expect(message).toContain('Combo discount: -₹50');
    expect(message).toContain('Total: ₹450');
  });

  it('omits the discount line entirely when there is no discount (backward compatible)', () => {
    const message = buildWhatsAppEnquiryMessage([{ name: 'Panda Lamp', quantity: 1, price: 130 }]);
    expect(message).not.toContain('Combo discount');
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
