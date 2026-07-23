'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/require-admin';
import type { OrderStatus } from '@/lib/supabase/types';

const VALID_STATUSES: OrderStatus[] = ['pending_whatsapp', 'pending_payment', 'paid', 'cancelled'];

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    if (!VALID_STATUSES.includes(status)) {
        throw new Error('Invalid order status.');
    }

    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
}
