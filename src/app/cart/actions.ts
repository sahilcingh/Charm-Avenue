'use server';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { buildWhatsAppEnquiryMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { validateContactDetails, type ContactDetailsInput } from '@/lib/checkout-validation';

export interface CartLineItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  // Snapshotted onto order_items at insert time — the variant row can be
  // edited or deleted later, but the order must forever reflect what was
  // actually enquired about.
  variantId?: string;
  variantLabel?: string;
  variantImage?: string;
  personalizationText?: string;
}

interface CreateWhatsAppEnquiryResult {
  error?: string;
  orderId?: string;
  whatsappUrl?: string;
}

/**
 * Records a guest-friendly enquiry (no login required) and builds a
 * pre-filled WhatsApp message — item list and total only, never the contact
 * details below. Everything after this (delivery address, final price,
 * payment) is negotiated directly in the WhatsApp chat, not on the site.
 *
 * Name and phone are mandatory — collected purely so the admin can track the
 * enquiry in Admin → Orders, not because the site itself needs them for
 * anything. Address stays optional. Validated again here (not just in the
 * form) as defense in depth against a tampered/stray request.
 *
 * If the shopper happens to be logged in, `user_id` is still set so the
 * enquiry shows up in their Account → Order History — but it's never
 * required. The order id is generated here rather than read back via
 * `.select()` to avoid depending on SELECT-level RLS on INSERT...RETURNING.
 *
 * order_items are inserted as a second step (Supabase's JS client has no
 * multi-table transaction primitive). There's deliberately no attempt to
 * delete the order if that fails — no DELETE policy exists on `orders` for
 * any role — this is logged instead as a rare, known edge case.
 */
export async function createWhatsAppEnquiry(
  items: CartLineItem[],
  contact: ContactDetailsInput,
  discountTotal = 0
): Promise<CreateWhatsAppEnquiryResult> {
  if (items.length === 0) {
    return { error: 'Your bag is empty.' };
  }

  const contactErrors = validateContactDetails(contact);
  if (Object.keys(contactErrors).length > 0) {
    return { error: 'Please enter your name and a valid mobile number.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const itemsSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const subtotal = Math.max(0, itemsSubtotal - discountTotal);
  const orderId = randomUUID();

  const { error: orderError } = await supabase.from('orders').insert({
    id: orderId,
    user_id: user?.id ?? null,
    guest_name: contact.name.trim(),
    guest_phone: contact.phone.trim(),
    guest_address: contact.address.trim() || null,
    status: 'pending_whatsapp',
    subtotal,
    discount_total: discountTotal,
  });

  if (orderError) {
    console.error('[createWhatsAppEnquiry] failed to create order:', orderError.message);
    return { error: 'Could not record your enquiry. Please try again.' };
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      variant_id: item.variantId ?? null,
      variant_label: item.variantLabel ?? null,
      variant_image: item.variantImage ?? null,
      personalization_text: item.personalizationText ?? null,
    }))
  );

  if (itemsError) {
    console.error(
      '[createWhatsAppEnquiry] order',
      orderId,
      'created but its items failed to save:',
      itemsError.message
    );
    return { error: 'Could not save your enquiry items. Please try again.' };
  }

  const message = buildWhatsAppEnquiryMessage(
    items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: item.unitPrice,
    })),
    discountTotal
  );
  const whatsappUrl = buildWhatsAppUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '', message);

  return { orderId, whatsappUrl };
}
