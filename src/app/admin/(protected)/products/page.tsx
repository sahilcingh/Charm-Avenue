import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import type { DbCategory, DbProduct } from '@/lib/supabase/types';
import DeleteProductButton from './DeleteProductButton';

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const [{ data: products, error }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('*'),
  ]);

  const categoryBySlug = new Map((categories as DbCategory[] | null)?.map((c) => [c.slug, c]));
  const list = (products as DbProduct[] | null) ?? [];
  const liveCount = list.filter((p) => p.is_active).length;
  const hiddenCount = list.length - liveCount;

  // Total is the neutral anchor metric — no status color. Live/Hidden are a
  // breakdown of it, so each gets a quiet semantic tint (green vs. muted
  // grey) instead of every card sharing the same brand-rose treatment.
  const stats = [
    {
      key: 'total',
      icon: 'ShoppingBagIcon',
      label: 'Total',
      value: list.length,
      iconBg: 'var(--blush-bg)',
      iconColor: 'var(--blush-muted)',
      valueColor: 'var(--blush-text)',
    },
    {
      key: 'live',
      icon: 'CheckCircleIcon',
      label: 'Live',
      value: liveCount,
      iconBg: '#E8F5E9',
      iconColor: '#2E7D32',
      valueColor: 'var(--blush-text)',
      dotColor: '#2E7D32',
    },
    {
      key: 'hidden',
      icon: 'EyeSlashIcon',
      label: 'Hidden',
      value: hiddenCount,
      iconBg: '#EFE6E2',
      iconColor: '#8A7A75',
      valueColor: 'var(--blush-muted)',
      dotColor: '#8A7A75',
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 animate-enter">
        <h1
          className="font-elegant-serif text-3xl md:text-[2.25rem]"
          style={{ color: 'var(--blush-text)' }}
        >
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2 transition-all duration-300 hover:scale-[1.03]"
          style={{
            background: 'var(--blush-rose)',
            boxShadow: '0 4px 20px rgba(232,130,143,0.35)',
          }}
        >
          <Icon name="PlusIcon" size={16} />
          Add Product
        </Link>
      </div>

      {!error && list.length > 0 && (
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 animate-enter">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="bg-white rounded-2xl border p-4 md:p-5 flex flex-col gap-3 md:gap-4"
              style={{ borderColor: 'var(--blush-border)' }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: stat.iconBg }}
              >
                <Icon name={stat.icon} size={14} style={{ color: stat.iconColor }} />
              </span>
              <div className="min-w-0">
                <p
                  className="font-elegant-serif font-bold text-2xl md:text-3xl leading-none truncate"
                  style={{ color: stat.valueColor, fontVariantNumeric: 'tabular-nums' }}
                >
                  {stat.value}
                </p>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mt-2"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  {stat.dotColor && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: stat.dotColor }}
                    />
                  )}
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-white rounded-3xl p-8 card-bubble flex items-start gap-4 animate-enter">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--blush-bg)' }}
          >
            <Icon
              name="ExclamationTriangleIcon"
              size={18}
              style={{ color: 'var(--blush-rose-dark)' }}
            />
          </span>
          <p className="text-sm" style={{ color: 'var(--blush-rose-dark)' }}>
            Couldn&apos;t load products: {error.message}. If this is your first time here, make sure
            you&apos;ve run <code>supabase/schema.sql</code> in the Supabase SQL Editor.
          </p>
        </div>
      )}

      {!error && list.length === 0 && (
        <div className="bg-white rounded-3xl p-14 card-bubble text-center animate-enter">
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--blush-bg)' }}
          >
            <Icon name="PhotoIcon" size={26} style={{ color: 'var(--blush-border)' }} />
          </span>
          <p className="font-bold mb-1" style={{ color: 'var(--blush-text)' }}>
            No products yet
          </p>
          <p className="text-sm" style={{ color: 'var(--blush-muted)' }}>
            Click &quot;Add Product&quot; above to create your first one.
          </p>
        </div>
      )}

      {!error && list.length > 0 && (
        <div
          className="bg-white rounded-2xl border animate-enter delay-200 lg:hidden"
          style={{ borderColor: 'var(--blush-border)' }}
        >
          {list.map((product, i) => {
            const category = categoryBySlug.get(product.category_slug);
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 p-4 border-b last:border-0 transition-colors duration-150 hover:bg-[var(--blush-bg)] animate-enter"
                style={{
                  borderColor: 'var(--blush-border)',
                  animationDelay: `${Math.min(i, 8) * 60}ms`,
                }}
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.image_alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold tracking-tight truncate text-[0.9375rem]"
                    style={{ color: 'var(--blush-text)' }}
                  >
                    {product.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
                    >
                      {category ? `${category.emoji} ${category.title}` : product.category_slug}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={
                        product.is_active
                          ? {
                              background: '#E8F5E9',
                              color: '#2E7D32',
                              border: '1px solid rgba(46,125,50,0.16)',
                            }
                          : {
                              background: '#EFE6E2',
                              color: '#8A7A75',
                              border: '1px solid rgba(138,122,117,0.18)',
                            }
                      }
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: product.is_active ? '#2E7D32' : '#8A7A75' }}
                      />
                      {product.is_active ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  <p className="mt-1.5">
                    <span
                      className="font-elegant-serif font-semibold text-sm"
                      style={{ color: 'var(--blush-text)' }}
                    >
                      ₹{product.price}
                    </span>
                    {product.original_price && (
                      <span
                        className="text-xs line-through ml-1.5"
                        style={{ color: 'var(--blush-muted)' }}
                      >
                        ₹{product.original_price}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <Link
                    href={`/admin/products/${product.id}`}
                    aria-label={`Edit ${product.name}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose)] hover:text-white"
                  >
                    <Icon name="PencilSquareIcon" size={15} />
                  </Link>
                  <DeleteProductButton productId={product.id} productName={product.name} />
                </div>
              </div>
            );
          })}
          <div
            className="px-4 py-3 border-t text-xs"
            style={{
              borderColor: 'var(--blush-border)',
              color: 'var(--blush-muted)',
              background: 'var(--blush-bg)',
            }}
          >
            Showing {list.length} {list.length === 1 ? 'product' : 'products'}
          </div>
        </div>
      )}

      {!error && list.length > 0 && (
        <div
          className="hidden lg:block bg-white rounded-3xl border overflow-x-auto animate-enter delay-200"
          style={{ borderColor: 'var(--blush-border)' }}
        >
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr style={{ background: 'var(--blush-bg)' }}>
                <th className="px-5 py-3.5"></th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Product
                </th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Category
                </th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Price
                </th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Status
                </th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide text-right"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((product, i) => {
                const category = categoryBySlug.get(product.category_slug);
                return (
                  <tr
                    key={product.id}
                    className="group border-t transition-colors duration-150 hover:bg-[var(--blush-bg)] animate-enter"
                    style={{
                      borderColor: 'var(--blush-border)',
                      animationDelay: `${Math.min(i, 8) * 60}ms`,
                    }}
                  >
                    <td className="pl-5 pr-2 py-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt={product.image_alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td
                      className="px-5 py-4 font-bold tracking-tight text-[0.9375rem]"
                      style={{ color: 'var(--blush-text)' }}
                    >
                      {product.name}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
                      >
                        {category ? `${category.emoji} ${category.title}` : product.category_slug}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="font-elegant-serif font-semibold"
                        style={{ color: 'var(--blush-text)' }}
                      >
                        ₹{product.price}
                      </span>
                      {product.original_price && (
                        <span
                          className="text-xs line-through ml-1.5"
                          style={{ color: 'var(--blush-muted)' }}
                        >
                          ₹{product.original_price}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={
                          product.is_active
                            ? {
                                background: '#E8F5E9',
                                color: '#2E7D32',
                                border: '1px solid rgba(46,125,50,0.16)',
                              }
                            : {
                                background: '#EFE6E2',
                                color: '#8A7A75',
                                border: '1px solid rgba(138,122,117,0.18)',
                              }
                        }
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: product.is_active ? '#2E7D32' : '#8A7A75' }}
                        />
                        {product.is_active ? 'Live' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/admin/products/${product.id}`}
                          aria-label={`Edit ${product.name}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose)] hover:text-white"
                        >
                          <Icon name="PencilSquareIcon" size={15} />
                        </Link>
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div
            className="px-5 py-3 border-t text-xs"
            style={{
              borderColor: 'var(--blush-border)',
              color: 'var(--blush-muted)',
              background: 'var(--blush-bg)',
            }}
          >
            Showing {list.length} {list.length === 1 ? 'product' : 'products'}
          </div>
        </div>
      )}
    </div>
  );
}
