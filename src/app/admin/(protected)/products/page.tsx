import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import type { DbCategory, DbProduct } from '@/lib/supabase/types';
import DeleteProductButton from './DeleteProductButton';
import AddCategoryButton from './AddCategoryButton';

const PAGE_SIZE = 20;

function PaginationControls({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-3 border-t"
      style={{ borderColor: 'var(--blush-border)' }}
    >
      <Link
        href={`/admin/products?page=${page - 1}`}
        aria-label="Previous page"
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
          prevDisabled ? 'pointer-events-none opacity-30' : 'hover:bg-[var(--blush-bg)]'
        }`}
        style={{ color: 'var(--blush-muted)' }}
      >
        <Icon name="ChevronLeftIcon" size={16} />
      </Link>
      <span className="text-xs font-semibold" style={{ color: 'var(--blush-muted)' }}>
        Page {page} of {totalPages}
      </span>
      <Link
        href={`/admin/products?page=${page + 1}`}
        aria-label="Next page"
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
          nextDisabled ? 'pointer-events-none opacity-30' : 'hover:bg-[var(--blush-bg)]'
        }`}
        style={{ color: 'var(--blush-muted)' }}
      >
        <Icon name="ChevronRightIcon" size={16} />
      </Link>
    </div>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const [
    { data: products, error, count: totalCount },
    { data: categories },
    { count: activeCount },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase.from('categories').select('*'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const categoryBySlug = new Map((categories as DbCategory[] | null)?.map((c) => [c.slug, c]));
  const list = (products as DbProduct[] | null) ?? [];
  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : from + 1;
  const rangeEnd = Math.min(from + list.length, total);
  const liveCount = activeCount ?? 0;
  const hiddenCount = total - liveCount;

  // Total is the neutral anchor metric — no status color. Live/Hidden are a
  // breakdown of it, so each gets a quiet semantic tint (green vs. muted
  // grey) instead of every card sharing the same brand-rose treatment.
  const stats = [
    {
      key: 'total',
      icon: 'ShoppingBagIcon',
      label: 'Total',
      value: total,
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1
          className="font-elegant-serif text-3xl md:text-[2.25rem]"
          style={{ color: 'var(--blush-text)' }}
        >
          Products
        </h1>
        <div className="flex items-center gap-3">
          <AddCategoryButton />
          <Link
            href="/admin/products/new"
            className="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2 transition-all duration-300 hover:scale-[1.03]"
            style={{
              background: 'var(--blush-rose-button)',
              boxShadow: '0 4px 20px rgba(232,130,143,0.35)',
            }}
          >
            <Icon name="PlusIcon" size={16} />
            Add Product
          </Link>
        </div>
      </div>

      {!error && total > 0 && (
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
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
        <div className="bg-white rounded-3xl p-8 card-bubble flex items-start gap-4">
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

      {!error && list.length === 0 && total === 0 && (
        <div className="bg-white rounded-3xl p-14 card-bubble text-center">
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

      {!error && list.length === 0 && total > 0 && (
        <div className="bg-white rounded-3xl p-14 card-bubble text-center">
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--blush-bg)' }}
          >
            <Icon name="PhotoIcon" size={26} style={{ color: 'var(--blush-border)' }} />
          </span>
          <p className="font-bold mb-1" style={{ color: 'var(--blush-text)' }}>
            No products on this page
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--blush-muted)' }}>
            You&apos;re on page {page}, but there {total === 1 ? 'is' : 'are'} only {total}{' '}
            {total === 1 ? 'product' : 'products'} in total.
          </p>
          <Link
            href="/admin/products?page=1"
            className="text-sm font-bold hover:underline"
            style={{ color: 'var(--blush-rose-text)' }}
          >
            Back to page 1
          </Link>
        </div>
      )}

      {!error && list.length > 0 && (
        <div
          className="bg-white rounded-2xl border lg:hidden"
          style={{ borderColor: 'var(--blush-border)' }}
        >
          {list.map((product) => {
            const category = categoryBySlug.get(product.category_slug);
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 p-4 border-b last:border-0 transition-colors duration-150 hover:bg-[var(--blush-bg)]"
                style={{
                  borderColor: 'var(--blush-border)',
                }}
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                  <AppImage
                    src={product.image}
                    alt={product.image_alt}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
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
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose-button)] hover:text-white"
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
            Showing {rangeStart}–{rangeEnd} of {total} {total === 1 ? 'product' : 'products'}
          </div>
          <PaginationControls page={page} totalPages={totalPages} />
        </div>
      )}

      {!error && list.length > 0 && (
        <div
          className="hidden lg:block bg-white rounded-3xl border overflow-x-auto"
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
              {list.map((product) => {
                const category = categoryBySlug.get(product.category_slug);
                return (
                  <tr
                    key={product.id}
                    className="group border-t transition-colors duration-150 hover:bg-[var(--blush-bg)]"
                    style={{
                      borderColor: 'var(--blush-border)',
                    }}
                  >
                    <td className="pl-5 pr-2 py-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <AppImage
                          src={product.image}
                          alt={product.image_alt}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
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
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose-button)] hover:text-white"
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
            Showing {rangeStart}–{rangeEnd} of {total} {total === 1 ? 'product' : 'products'}
          </div>
          <PaginationControls page={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
