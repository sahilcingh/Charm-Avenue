export interface WhatsAppEnquiryItem {
  name: string;
  quantity: number;
  price: number;
}

/**
 * Composes the pre-filled WhatsApp enquiry message from a cart's line items.
 * Deliberately product-only — name/phone/address entered at checkout are
 * recorded in the `orders` table, not included here. WhatsApp is for product
 * enquiry; order/delivery details are handled elsewhere.
 */
export function buildWhatsAppEnquiryMessage(
  items: WhatsAppEnquiryItem[],
  discountTotal = 0
): string {
  if (items.length === 0) {
    return "Hi! I'd like to enquire about some products from Charm Avenue.";
  }

  const lines = items.map(
    (item) => `${item.name} x${item.quantity} - ₹${item.price * item.quantity}`
  );
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountLine = discountTotal > 0 ? [`Combo discount: -₹${discountTotal}`] : [];

  return [
    "Hi! I'd like to enquire about:",
    ...lines,
    ...discountLine,
    `Total: ₹${itemsTotal - discountTotal}`,
  ].join('\n');
}

/** Builds a wa.me deep link that opens WhatsApp with the given message pre-filled. */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
