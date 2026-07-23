import { NextRequest, NextResponse } from 'next/server';
import { verifyCashfreeWebhookSignature } from '@/lib/cashfree';
import { createServiceClient } from '@/lib/supabase/service-client';

interface CashfreeWebhookPayload {
    type?: string;
    data?: {
        order?: { order_id?: string };
        payment?: { cf_payment_id?: string };
    };
}

/**
 * The only place an order is ever marked "paid" — never a client-side
 * "success" redirect, which can be spoofed or interrupted mid-flow. Must read
 * the RAW body text (not request.json()) since the signature is computed
 * over the exact, unmodified bytes Cashfree sent.
 */
export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature') ?? '';
    const timestamp = request.headers.get('x-webhook-timestamp') ?? '';
    const secret = process.env.CASHFREE_WEBHOOK_SECRET;

    if (!secret) {
        console.error('[cashfree webhook] CASHFREE_WEBHOOK_SECRET is not configured');
        return NextResponse.json({ error: 'not configured' }, { status: 500 });
    }

    if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature, secret)) {
        return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
    }

    let payload: CashfreeWebhookPayload;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'invalid json' }, { status: 400 });
    }

    const orderId = payload.data?.order?.order_id;
    if (!orderId) {
        return NextResponse.json({ error: 'missing order id' }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
        console.error('[cashfree webhook] SUPABASE_SERVICE_ROLE_KEY is not configured');
        return NextResponse.json({ error: 'not configured' }, { status: 500 });
    }

    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'paid', payment_gateway_payment_id: payload.data?.payment?.cf_payment_id ?? null })
            .eq('id', orderId);
        if (error) {
            console.error('[cashfree webhook] failed to mark order paid', orderId, error.message);
            return NextResponse.json({ error: 'db update failed' }, { status: 500 });
        }
    }

    return NextResponse.json({ ok: true });
}
