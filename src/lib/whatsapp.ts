export interface WhatsAppEnquiryItem {
  name: string;
  quantity: number;
  variantLabel?: string;
}

/**
 * Composes the pre-filled WhatsApp enquiry message from a cart's line items.
 * Deliberately product/variant/quantity only — no price or total (price is
 * negotiated in the chat, not stated here), and no name/phone/address
 * (those are recorded in the `orders` table, not included here).
 */
export function buildWhatsAppEnquiryMessage(items: WhatsAppEnquiryItem[]): string {
  if (items.length === 0) {
    return "Hi! I'd like to enquire about some products from Charm Avenue.";
  }

  const lines = items.map((item) => {
    const variant = item.variantLabel ? ` (${item.variantLabel})` : '';
    return `• ${item.name}${variant}, Qty ${item.quantity}`;
  });

  return ["Hi! I'd like to enquire about:", '', ...lines, '', 'Thank you!'].join('\n');
}

/** Builds a wa.me deep link that opens WhatsApp with the given message pre-filled. */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export interface WhatsAppBillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  variantLabel?: string;
}

/**
 * Composes the pre-filled WhatsApp bill message the admin sends back to the
 * customer's own number, once price and delivery have been settled in chat.
 * Unlike the enquiry message, this one does include pricing — that's the
 * point of a bill.
 */
export function buildWhatsAppBillMessage(
  orderId: string,
  items: WhatsAppBillItem[],
  subtotal: number,
  discountTotal = 0
): string {
  const lines = items.map((item) => {
    const variant = item.variantLabel ? ` (${item.variantLabel})` : '';
    return `• ${item.name}${variant} x${item.quantity} - ₹${item.unitPrice * item.quantity}`;
  });

  if (discountTotal > 0) {
    lines.push('', `Combo discount: -₹${discountTotal}`);
  }
  lines.push('', `Total: ₹${subtotal}`);

  return [
    `Hi! Here's your bill for order #${orderId.slice(0, 8)}:`,
    '',
    ...lines,
    '',
    'Thank you for shopping with Charm Avenue!',
  ].join('\n');
}
