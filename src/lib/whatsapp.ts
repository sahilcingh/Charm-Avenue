export interface WhatsAppEnquiryItem {
    name: string;
    quantity: number;
    price: number;
}

/** Composes the pre-filled WhatsApp enquiry message from a cart's line items. */
export function buildWhatsAppEnquiryMessage(items: WhatsAppEnquiryItem[]): string {
    if (items.length === 0) {
        return "Hi! I'd like to enquire about some products from Charm Avenue.";
    }

    const lines = items.map((item) => `${item.name} x${item.quantity} - ₹${item.price * item.quantity}`);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return ["Hi! I'd like to enquire about:", ...lines, `Total: ₹${total}`].join('\n');
}

/** Builds a wa.me deep link that opens WhatsApp with the given message pre-filled. */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
