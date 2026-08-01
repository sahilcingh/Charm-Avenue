'use client';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import type { LiveSearchResult } from '@/lib/use-live-product-search';

interface SearchResultsDropdownProps {
  query: string;
  results: LiveSearchResult[];
  loading: boolean;
  onNavigate: () => void;
  className?: string;
}

export default function SearchResultsDropdown({
  query,
  results,
  loading,
  onNavigate,
  className = '',
}: SearchResultsDropdownProps) {
  return (
    <div
      role="listbox"
      className={`rounded-2xl border overflow-hidden bg-white shadow-lg ${className}`}
      style={{ borderColor: 'var(--blush-border)' }}
    >
      {loading && results.length === 0 ? (
        <p className="text-sm px-4 py-4 text-center" style={{ color: 'var(--blush-muted)' }}>
          Searching…
        </p>
      ) : results.length === 0 ? (
        <p className="text-sm px-4 py-4 text-center" style={{ color: 'var(--blush-muted)' }}>
          No products match &quot;{query}&quot;.
        </p>
      ) : (
        <ul>
          {results.map((product) => (
            <li key={product.id}>
              <Link
                href={`/product/${product.slug}`}
                onClick={onNavigate}
                className="flex items-center gap-3 px-3 py-2.5 border-b last:border-0 transition-colors duration-150 hover:bg-[var(--blush-bg)]"
                style={{ borderColor: 'var(--blush-border)' }}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                  <AppImage
                    src={product.image}
                    alt={product.imageAlt}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="flex-1 min-w-0 text-sm font-semibold truncate"
                  style={{ color: 'var(--blush-text)' }}
                >
                  {product.name}
                </span>
                <span
                  className="font-elegant-serif font-bold text-sm shrink-0"
                  style={{ color: 'var(--blush-rose-text)' }}
                >
                  ₹{product.price}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={`/search?q=${encodeURIComponent(query)}`}
        onClick={onNavigate}
        className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wide border-t transition-colors duration-150 hover:bg-[var(--blush-bg)]"
        style={{ borderColor: 'var(--blush-border)', color: 'var(--blush-rose-text)' }}
      >
        View all results
        <Icon name="ArrowRightIcon" size={12} />
      </Link>
    </div>
  );
}
