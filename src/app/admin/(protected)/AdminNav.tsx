'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/tags', label: 'Tags' },
    { href: '/admin/combos', label: 'Combos' },
];

export default function AdminNav() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-1 p-1 rounded-full overflow-x-auto max-w-full" style={{ background: 'var(--blush-bg)' }}>
            {NAV_ITEMS.map((item) => {
                const active = pathname?.startsWith(item.href) ?? false;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors duration-150 shrink-0"
                        style={
                            active
                                ? { background: '#FFFFFF', color: 'var(--blush-text)', boxShadow: '0 1px 3px rgba(30,23,18,0.08)' }
                                : { color: 'var(--blush-muted)' }
                        }
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
