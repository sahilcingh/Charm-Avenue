'use server';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { validateCheckoutForm, type CheckoutFormInput } from '@/lib/checkout-validation';
import { buildWhatsAppEnquiryMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { buildCashfreeOrderPayload } from '@/lib/cashfree';

export interface CheckoutLineItem {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    // Snapshotted onto order_items at insert time — see the migration
    // comment for why (the variant row can be edited/deleted later).
    variantId?: string;
    variantLabel?: string;
    variantImage?: string;
    personalizationText?: string;
}

interface CreateWhatsAppOrderResult {
    error?: string;
    orderId?: string;
    whatsappUrl?: string;
}

/**
 * Creates a real order record (status: pending_whatsapp) for the signed-in
 * customer, then builds a plain product-enquiry WhatsApp message — item list
 * and total only, no delivery details. The order id is generated here rather
 * than read back via `.select()` to avoid depending on SELECT-level RLS on
 * INSERT...RETURNING.
 *
 * order_items are inserted as a second step (Supabase's JS client has no
 * multi-table transaction primitive). There's deliberately no attempt to
 * delete the order if that fails — no DELETE policy exists on `orders` for
 * any role, so that call would silently no-op — this is logged instead as a
 * rare, known edge case rather than pretending to roll back.
 */
export async function createWhatsAppOrder(
    details: CheckoutFormInput,
    items: CheckoutLineItem[],
    discountTotal = 0
): Promise<CreateWhatsAppOrderResult> {
    const errors = validateCheckoutForm(details);
    if (Object.keys(errors).length > 0) {
        return { error: 'Please fix the highlighted fields.' };
    }
    if (items.length === 0) {
        return { error: 'Your bag is empty.' };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Please sign in to place an order.' };
    }

    const itemsSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const subtotal = Math.max(0, itemsSubtotal - discountTotal);
    const orderId = randomUUID();

    const { error: orderError } = await supabase.from('orders').insert({
        id: orderId,
        user_id: user.id,
        guest_name: details.name,
        guest_phone: details.phone,
        guest_address: details.address,
        status: 'pending_whatsapp',
        subtotal,
        discount_total: discountTotal,
    });

    if (orderError) {
        console.error('[createWhatsAppOrder] failed to create order:', orderError.message);
        return { error: 'Could not create your order. Please try again.' };
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
        console.error('[createWhatsAppOrder] order', orderId, 'created but its items failed to save:', itemsError.message);
        return { error: 'Could not save your order items. Please try again.' };
    }

    const message = buildWhatsAppEnquiryMessage(
        items.map((item) => ({ name: item.productName, quantity: item.quantity, price: item.unitPrice })),
        discountTotal
    );
    const whatsappUrl = buildWhatsAppUrl(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '', message);

    return { orderId, whatsappUrl };
}

interface CreatePaymentOrderResult {
    error?: string;
    orderId?: string;
    paymentSessionId?: string;
}

/**
 * Creates a real order (status: pending_payment) and starts a Cashfree
 * payment session. The order is only ever marked "paid" by the webhook
 * (src/app/api/webhooks/cashfree/route.ts) confirming payment server-side —
 * never by this action or any client-side "success" redirect, which can be
 * spoofed or interrupted mid-flow.
 */
export async function createPaymentOrder(
    details: CheckoutFormInput,
    items: CheckoutLineItem[],
    discountTotal = 0
): Promise<CreatePaymentOrderResult> {
    const errors = validateCheckoutForm(details);
    if (Object.keys(errors).length > 0) {
        return { error: 'Please fix the highlighted fields.' };
    }
    if (items.length === 0) {
        return { error: 'Your bag is empty.' };
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secretKey) {
        return { error: 'Online payment isn’t set up yet — please use "Enquire via WhatsApp" instead.' };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Please sign in to place an order.' };
    }

    const itemsSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const subtotal = Math.max(0, itemsSubtotal - discountTotal);
    const orderId = randomUUID();

    const { error: orderError } = await supabase.from('orders').insert({
        id: orderId,
        user_id: user.id,
        guest_name: details.name,
        guest_phone: details.phone,
        guest_address: details.address,
        status: 'pending_payment',
        subtotal,
        discount_total: discountTotal,
        // Cashfree's own order_id is set to this same generated id (see
        // buildCashfreeOrderPayload below), so it's known upfront — no need
        // for a later UPDATE, which the customer's own RLS grant can't do
        // anyway (orders UPDATE is admin-only).
        payment_gateway_order_id: orderId,
    });

    if (orderError) {
        console.error('[createPaymentOrder] failed to create order:', orderError.message);
        return { error: 'Could not create your order. Please try again.' };
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
        console.error('[createPaymentOrder] order', orderId, 'created but its items failed to save:', itemsError.message);
        return { error: 'Could not save your order items. Please try again.' };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const payload = buildCashfreeOrderPayload({
        orderId,
        amount: subtotal,
        customerName: details.name,
        customerPhone: details.phone,
        returnUrl: `${siteUrl}/order/{order_id}`,
    });

    const apiBaseUrl = process.env.CASHFREE_API_BASE_URL || 'https://api.cashfree.com/pg';
    const response = await fetch(`${apiBaseUrl}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-client-id': appId,
            'x-client-secret': secretKey,
            'x-api-version': '2023-08-01',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        console.error('[createPaymentOrder] Cashfree rejected order', orderId, '- left in pending_payment, not deleted (no delete policy exists)');
        return { error: 'Could not start payment. Please try again, or use WhatsApp instead.' };
    }

    const cashfreeOrder = (await response.json()) as { payment_session_id?: string };

    return { orderId, paymentSessionId: cashfreeOrder.payment_session_id };
}
