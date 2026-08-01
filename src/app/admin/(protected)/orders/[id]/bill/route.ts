import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/require-admin';
import type { DbOrder, DbOrderItem } from '@/lib/supabase/types';
import { renderBillPdf } from '@/lib/pdf/render-bill-pdf';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'You must be an admin to do this.';
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).maybeSingle(),
    supabase.from('order_items').select('*').eq('order_id', id),
  ]);

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const orderRow = order as DbOrder;
  const orderItems = (items ?? []) as DbOrderItem[];

  const pdfBuffer = await renderBillPdf({
    orderId: orderRow.id,
    createdAt: orderRow.created_at,
    guestName: orderRow.guest_name,
    guestPhone: orderRow.guest_phone,
    guestAddress: orderRow.guest_address,
    items: orderItems.map((item) => ({
      name: item.product_name,
      variantLabel: item.variant_label,
      personalizationText: item.personalization_text,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
    discountTotal: orderRow.discount_total,
    total: orderRow.subtotal,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="charm-avenue-bill-${orderRow.id.slice(0, 8)}.pdf"`,
    },
  });
}
