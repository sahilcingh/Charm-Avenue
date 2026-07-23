import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyCashfreeWebhookSignature, buildCashfreeOrderPayload } from './cashfree';

const SECRET = 'test-secret-key';

function sign(timestamp: string, body: string, secret = SECRET): string {
    return crypto.createHmac('sha256', secret).update(timestamp + body).digest('base64');
}

describe('verifyCashfreeWebhookSignature', () => {
    it('accepts a correctly signed payload (computed independently via node:crypto, not reusing the implementation)', () => {
        const timestamp = '1700000000';
        const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: 'abc123' } } });
        const signature = sign(timestamp, body);

        expect(verifyCashfreeWebhookSignature(body, timestamp, signature, SECRET)).toBe(true);
    });

    it('rejects a tampered body even if the signature was valid for the original body (failure case: the real security property)', () => {
        const timestamp = '1700000000';
        const originalBody = JSON.stringify({ data: { order: { order_id: 'abc123' } } });
        const signature = sign(timestamp, originalBody);
        const tamperedBody = JSON.stringify({ data: { order: { order_id: 'someone-elses-order' } } });

        expect(verifyCashfreeWebhookSignature(tamperedBody, timestamp, signature, SECRET)).toBe(false);
    });

    it('rejects a signature computed with the wrong secret (failure case: forged webhook)', () => {
        const timestamp = '1700000000';
        const body = JSON.stringify({ data: { order: { order_id: 'abc123' } } });
        const signature = sign(timestamp, body, 'wrong-secret');

        expect(verifyCashfreeWebhookSignature(body, timestamp, signature, SECRET)).toBe(false);
    });

    it('rejects a malformed/non-base64 signature without throwing (edge case)', () => {
        expect(() => verifyCashfreeWebhookSignature('body', '123', 'not-valid-base64!!!', SECRET)).not.toThrow();
        expect(verifyCashfreeWebhookSignature('body', '123', 'not-valid-base64!!!', SECRET)).toBe(false);
    });
});

describe('buildCashfreeOrderPayload', () => {
    it('builds a Cashfree-shaped order creation request from our order details', () => {
        const payload = buildCashfreeOrderPayload({
            orderId: 'order-1',
            amount: 260,
            customerName: 'Priya Sharma',
            customerPhone: '9876543210',
            returnUrl: 'https://charmavenue.example.com/order/{order_id}',
        });

        expect(payload.order_id).toBe('order-1');
        expect(payload.order_amount).toBe(260);
        expect(payload.order_currency).toBe('INR');
        expect(payload.customer_details.customer_phone).toBe('9876543210');
        expect(payload.order_meta.return_url).toContain('{order_id}');
    });

    it('rounds the amount to two decimal places, as Cashfree requires', () => {
        const payload = buildCashfreeOrderPayload({
            orderId: 'order-1',
            amount: 130.005,
            customerName: 'Priya Sharma',
            customerPhone: '9876543210',
            returnUrl: 'https://example.com/order/{order_id}',
        });

        expect(payload.order_amount).toBe(130.01);
    });
});
