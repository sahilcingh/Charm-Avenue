import crypto from 'node:crypto';

/**
 * Verifies a Cashfree webhook signature: HMAC-SHA256 of
 * `timestamp + rawBody` (concatenated, no separator), keyed with the
 * webhook secret, base64-encoded, compared against the x-webhook-signature
 * header. Must be called with the RAW request body text — re-serializing a
 * parsed JSON object produces a different string and a false mismatch.
 * Verified against Cashfree's own docs: https://www.cashfree.com/docs/api-reference/vrs/webhook-signature-verification
 */
export function verifyCashfreeWebhookSignature(
    rawBody: string,
    timestamp: string,
    signature: string,
    secret: string
): boolean {
    const expected = crypto.createHmac('sha256', secret).update(timestamp + rawBody).digest('base64');

    const expectedBuffer = Buffer.from(expected, 'base64');
    const actualBuffer = Buffer.from(signature, 'base64');
    if (expectedBuffer.length !== actualBuffer.length) return false;

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export interface CashfreeOrderRequest {
    orderId: string;
    amount: number;
    customerName: string;
    customerPhone: string;
    returnUrl: string;
}

/** Builds the request body for Cashfree's Create Order API. */
export function buildCashfreeOrderPayload(request: CashfreeOrderRequest) {
    return {
        order_id: request.orderId,
        order_amount: Math.round(request.amount * 100) / 100,
        order_currency: 'INR',
        customer_details: {
            customer_id: request.orderId,
            customer_name: request.customerName,
            customer_phone: request.customerPhone,
        },
        order_meta: {
            return_url: request.returnUrl,
        },
    };
}
