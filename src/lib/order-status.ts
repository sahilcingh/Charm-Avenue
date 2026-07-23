import type { OrderStatus } from '@/lib/supabase/types';

// Each family gets its own color — pending is amber (not brand rose, which is
// reserved for interactive elements), paid is green, cancelled is neutral
// grey. The two pending sub-statuses share amber; they're both "not yet
// resolved," just via different channels.
export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
    pending_whatsapp: { label: 'Awaiting WhatsApp Confirmation', color: '#A6740A', bg: '#FBEBCF', border: 'rgba(166,116,10,0.18)' },
    pending_payment: { label: 'Awaiting Payment', color: '#A6740A', bg: '#FBEBCF', border: 'rgba(166,116,10,0.18)' },
    paid: { label: 'Paid', color: '#2E7D32', bg: '#E8F5E9', border: 'rgba(46,125,50,0.16)' },
    cancelled: { label: 'Cancelled', color: '#8A7A75', bg: '#EFE6E2', border: 'rgba(138,122,117,0.18)' },
};
