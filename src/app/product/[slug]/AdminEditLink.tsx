'use client';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useAdminMode } from '@/lib/admin-mode-context';

export default function AdminEditLink({ productId }: { productId: string }) {
    const { adminModeOn } = useAdminMode();
    if (!adminModeOn) return null;

    return (
        <Link
            href={`/admin/products/${productId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-4 px-3 py-1.5 rounded-full w-fit hover:opacity-80 transition-opacity"
            style={{ background: 'var(--blush-border)', color: 'var(--blush-rose)' }}
        >
            <Icon name="PencilSquareIcon" size={13} />
            Edit Product
        </Link>
    );
}
