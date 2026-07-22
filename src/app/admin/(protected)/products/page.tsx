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

    const stats = [
        { icon: 'ShoppingBagIcon', label: 'Total Products', value: list.length },
        { icon: 'CheckCircleIcon', label: 'Live on Storefront', value: liveCount },
        { icon: 'EyeSlashIcon', label: 'Hidden / Draft', value: hiddenCount },
    ];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-enter">
                <h1 className="font-elegant-serif text-2xl md:text-3xl" style={{ color: 'var(--blush-text)' }}>
                    Products
                </h1>
                <Link
                    href="/admin/products/new"
                    className="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2 transition-all duration-300 hover:scale-[1.03]"
                    style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
                >
                    <Icon name="PlusIcon" size={16} />
                    Add Product
                </Link>
            </div>

            {!error && list.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {stats.map((stat, i) => (
                        <div
                            key={stat.label}
                            className="bg-white rounded-3xl p-5 card-bubble flex items-center gap-3 animate-enter"
                            style={{ animationDelay: `${100 + i * 80}ms` }}
                        >
                            <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--blush-bg)' }}>
                                <Icon name={stat.icon} size={18} style={{ color: 'var(--blush-rose)' }} />
                            </span>
                            <div>
                                <p className="font-elegant-serif font-bold text-xl" style={{ color: 'var(--blush-text)' }}>{stat.value}</p>
                                <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="bg-white rounded-3xl p-8 card-bubble flex items-start gap-4 animate-enter">
                    <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--blush-bg)' }}>
                        <Icon name="ExclamationTriangleIcon" size={18} style={{ color: 'var(--blush-rose-dark)' }} />
                    </span>
                    <p className="text-sm" style={{ color: 'var(--blush-rose-dark)' }}>
                        Couldn&apos;t load products: {error.message}. If this is your first time here, make sure you&apos;ve
                        run <code>supabase/schema.sql</code> in the Supabase SQL Editor.
                    </p>
                </div>
            )}

            {!error && list.length === 0 && (
                <div className="bg-white rounded-3xl p-14 card-bubble text-center animate-enter">
                    <span className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--blush-bg)' }}>
                        <Icon name="PhotoIcon" size={26} style={{ color: 'var(--blush-border)' }} />
                    </span>
                    <p className="font-bold mb-1" style={{ color: 'var(--blush-text)' }}>No products yet</p>
                    <p className="text-sm" style={{ color: 'var(--blush-muted)' }}>
                        Click &quot;Add Product&quot; above to create your first one.
                    </p>
                </div>
            )}

            {!error && list.length > 0 && (
                <div className="bg-white rounded-3xl card-bubble overflow-x-auto animate-enter delay-200">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--blush-border)' }}>
                                <th className="px-5 py-3 font-semibold" style={{ color: 'var(--blush-muted)' }}></th>
                                <th className="px-5 py-3 font-semibold" style={{ color: 'var(--blush-muted)' }}>Product</th>
                                <th className="px-5 py-3 font-semibold" style={{ color: 'var(--blush-muted)' }}>Category</th>
                                <th className="px-5 py-3 font-semibold" style={{ color: 'var(--blush-muted)' }}>Price</th>
                                <th className="px-5 py-3 font-semibold" style={{ color: 'var(--blush-muted)' }}>Status</th>
                                <th className="px-5 py-3 font-semibold text-right" style={{ color: 'var(--blush-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((product, i) => {
                                const category = categoryBySlug.get(product.category_slug);
                                return (
                                    <tr
                                        key={product.id}
                                        className="group border-b last:border-0 transition-colors duration-200 animate-enter"
                                        style={{ borderColor: 'var(--blush-border)', animationDelay: `${Math.min(i, 8) * 60}ms` }}
                                    >
                                        <td className="px-5 py-3">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={product.image} alt={product.image_alt} className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 font-semibold" style={{ color: 'var(--blush-text)' }}>{product.name}</td>
                                        <td className="px-5 py-3">
                                            <span className="badge-pill text-xs" style={{ background: 'var(--blush-bg)', color: 'var(--blush-rose)' }}>
                                                {category ? `${category.emoji} ${category.title}` : product.category_slug}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="font-elegant-serif font-bold" style={{ color: 'var(--blush-text)' }}>₹{product.price}</span>
                                            {product.original_price && (
                                                <span className="text-xs line-through ml-1.5" style={{ color: 'var(--blush-muted)' }}>₹{product.original_price}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className="badge-pill text-xs inline-flex items-center gap-1.5"
                                                style={
                                                    product.is_active
                                                        ? { background: '#E8F5E9', color: '#2E7D32' }
                                                        : { background: 'var(--blush-border)', color: 'var(--blush-muted)' }
                                                }
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: product.is_active ? '#2E7D32' : 'var(--blush-muted)' }} />
                                                {product.is_active ? 'Live' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                <Link
                                                    href={`/admin/products/${product.id}`}
                                                    aria-label={`Edit ${product.name}`}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                                                    style={{ color: 'var(--blush-rose)' }}
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
                </div>
            )}
        </div>
    );
}
