'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

const NAV_ITEMS = [
  { href: '/admin/products', label: 'Products', icon: 'ShoppingBagIcon' },
  { href: '/admin/categories', label: 'Categories', icon: 'Squares2X2Icon' },
  { href: '/admin/orders', label: 'Orders', icon: 'ClipboardDocumentListIcon' },
  { href: '/admin/tags', label: 'Tags', icon: 'TagIcon' },
  { href: '/admin/combos', label: 'Combos', icon: 'GiftIcon' },
] as const;

/** Mobile-only fixed tab bar — replaces the horizontally-scrolling pill nav, which
 * could scroll active items partway out of view with no indication more existed. */
export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-white border-t"
      style={{
        borderColor: 'var(--blush-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href) ?? false;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="flex-1 flex flex-col items-center gap-0.5 py-2"
            style={{ color: active ? 'var(--blush-rose)' : 'var(--blush-muted)' }}
          >
            <span
              className="flex items-center justify-center rounded-2xl px-2.5 py-1 transition-colors duration-150"
              style={{ background: active ? 'var(--blush-bg)' : 'transparent' }}
            >
              <Icon name={item.icon} size={19} />
            </span>
            <span className="text-[0.625rem] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
