'use client';
import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cart-context';
import { createClient } from '@/lib/supabase/client';
import { mapProductRow, type Product } from '@/lib/supabase/product-mapper';
import type { DbCategory, DbProduct, DbProductVariant } from '@/lib/supabase/types';
import { resolveVariantDisplay, formatVariantLabel } from '@/lib/supabase/product-variants';
import { resolveComboDiscounts, type ComboDefinition } from '@/lib/supabase/combo-discounts';
import { validateCheckoutForm, type CheckoutFormInput, type CheckoutFormErrors } from '@/lib/checkout-validation';
import { createWhatsAppOrder, createPaymentOrder, type CheckoutLineItem } from './actions';

type ProductRowWithCategory = DbProduct & { category: Pick<DbCategory, 'title'> | null };
type ComboRow = { id: string; name: string; discount_percent: number; combo_products: { product_id: string }[] };

interface CashfreeCheckoutInstance {
    checkout: (options: { paymentSessionId: string; redirectTarget: string }) => void;
}

declare global {
    interface Window {
        Cashfree?: (options: { mode: 'sandbox' | 'production' }) => Promise<CashfreeCheckoutInstance>;
    }
}

const inputClass =
    'w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] focus:ring-2 focus:ring-[var(--blush-rose)]/15 transition-all duration-200';
const labelClass = 'text-xs font-bold uppercase tracking-wide mb-1.5 block';

export default function CheckoutClient({
    prefill,
    paymentEnabled,
}: {
    prefill: CheckoutFormInput;
    paymentEnabled: boolean;
}) {
    const router = useRouter();
    const { lines, hydrated } = useCart();
    const [productsById, setProductsById] = useState<Record<string, Product> | null>(null);
    const [variantsById, setVariantsById] = useState<Record<string, DbProductVariant>>({});
    const [combos, setCombos] = useState<ComboDefinition[]>([]);
    const [form, setForm] = useState<CheckoutFormInput>(prefill);
    const [errors, setErrors] = useState<CheckoutFormErrors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [payError, setPayError] = useState<string | null>(null);
    const [payPending, setPayPending] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const supabase = createClient();
        supabase
            .from('combos')
            .select('id, name, discount_percent, combo_products(product_id)')
            .eq('is_active', true)
            .then(({ data }) => {
                const rows = (data ?? []) as unknown as ComboRow[];
                setCombos(
                    rows.map((row) => ({
                        id: row.id,
                        name: row.name,
                        discountPercent: row.discount_percent,
                        productIds: row.combo_products.map((cp) => cp.product_id),
                    }))
                );
            });
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        if (lines.length === 0) {
            setProductsById({});
            return;
        }
        let cancelled = false;
        const supabase = createClient();
        supabase
            .from('products')
            .select('*, category:categories!products_category_slug_fkey(title)')
            .in('id', lines.map((l) => l.productId))
            .then(({ data }) => {
                if (cancelled) return;
                const map: Record<string, Product> = {};
                ((data ?? []) as unknown as ProductRowWithCategory[]).forEach((row) => {
                    map[row.id] = mapProductRow(row, row.category?.title);
                });
                setProductsById(map);
            });

        const variantIds = lines.map((l) => l.variantId).filter((id): id is string => Boolean(id));
        if (variantIds.length > 0) {
            supabase
                .from('product_variants')
                .select('*')
                .in('id', variantIds)
                .then(({ data }) => {
                    if (cancelled) return;
                    const map: Record<string, DbProductVariant> = {};
                    ((data ?? []) as DbProductVariant[]).forEach((row) => {
                        map[row.id] = row;
                    });
                    setVariantsById(map);
                });
        } else {
            setVariantsById({});
        }

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated, lines.map((l) => l.productId).sort().join(','), lines.map((l) => l.variantId ?? '').sort().join(',')]);

    if (productsById === null) {
        return (
            <section className="w-full px-4 md:px-10 pb-20">
                <div className="max-w-screen-md mx-auto text-center" style={{ color: 'var(--blush-muted)' }}>
                    Loading your bag…
                </div>
            </section>
        );
    }

    const items = lines
        .map((line) => {
            const product = productsById[line.productId];
            if (!product) return null;
            const variant = line.variantId ? variantsById[line.variantId] ?? null : null;
            const resolved = resolveVariantDisplay(
                { price: product.price, originalPrice: product.originalPrice ?? null, image: product.image },
                variant
            );
            return { line, product, variant, effectivePrice: resolved.price, effectiveImage: resolved.image };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (items.length === 0) {
        return (
            <section className="w-full px-4 md:px-10 pb-20 text-center">
                <span className="text-5xl block mb-4">🛍️</span>
                <h2 className="font-elegant-serif text-2xl mb-2" style={{ color: 'var(--blush-text)' }}>Your bag is empty</h2>
                <p className="mb-8" style={{ color: 'var(--blush-muted)' }}>Add something cute before checking out.</p>
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02]"
                    style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
                >
                    <Icon name="ShoppingBagIcon" size={16} />
                    Start Shopping
                </Link>
            </section>
        );
    }

    const subtotal = items.reduce((sum, { line, effectivePrice }) => sum + effectivePrice * line.quantity, 0);

    const priceByProduct = new Map<string, number>();
    items.forEach(({ product, effectivePrice }) => {
        if (!priceByProduct.has(product.id)) priceByProduct.set(product.id, effectivePrice);
    });
    const comboMatches = resolveComboDiscounts(
        Array.from(priceByProduct, ([productId, unitPrice]) => ({ productId, unitPrice })),
        combos
    );
    const discountTotal = comboMatches.reduce((sum, m) => sum + m.amount, 0);
    const total = subtotal - discountTotal;

    const lineItems: CheckoutLineItem[] = items.map(({ line, product, variant, effectivePrice, effectiveImage }) => ({
        productId: product.id,
        productName: product.name,
        unitPrice: effectivePrice,
        quantity: line.quantity,
        variantId: variant?.id,
        variantLabel: variant ? formatVariantLabel(variant) ?? undefined : undefined,
        variantImage: variant ? effectiveImage : undefined,
        personalizationText: line.personalizationText,
    }));

    function handleWhatsAppSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitError(null);
        const fieldErrors = validateCheckoutForm(form);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0) return;

        startTransition(async () => {
            const result = await createWhatsAppOrder(form, lineItems, discountTotal);
            if (result.error || !result.orderId || !result.whatsappUrl) {
                setSubmitError(result.error ?? 'Something went wrong. Please try again.');
                return;
            }
            window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
            router.push(`/order/${result.orderId}`);
        });
    }

    async function handlePayNow() {
        setPayError(null);
        const fieldErrors = validateCheckoutForm(form);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0) return;

        setPayPending(true);
        const result = await createPaymentOrder(form, lineItems, discountTotal);

        if (result.error || !result.paymentSessionId) {
            setPayPending(false);
            setPayError(result.error ?? 'Something went wrong. Please try again.');
            return;
        }

        if (!window.Cashfree) {
            setPayPending(false);
            setPayError('Payment could not start. Please refresh and try again.');
            return;
        }

        const cashfree = await window.Cashfree({
            mode: process.env.NEXT_PUBLIC_CASHFREE_MODE === 'production' ? 'production' : 'sandbox',
        });
        cashfree.checkout({ paymentSessionId: result.paymentSessionId, redirectTarget: '_self' });
    }

    return (
        <section className="w-full px-4 md:px-10 pb-20">
            <div className="max-w-screen-md mx-auto grid gap-6">
                <form onSubmit={handleWhatsAppSubmit} className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4">
                    <h2 className="font-elegant-serif text-lg" style={{ color: 'var(--blush-text)' }}>Delivery Details</h2>
                    <div>
                        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Full Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={inputClass}
                            style={{ color: 'var(--blush-text)' }}
                            placeholder="Your name"
                        />
                        {errors.name && <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>{errors.name}</p>}
                    </div>
                    <div>
                        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Phone Number</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className={inputClass}
                            style={{ color: 'var(--blush-text)' }}
                            placeholder="98765 43210"
                        />
                        {errors.phone && <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>{errors.phone}</p>}
                    </div>
                    <div>
                        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Delivery Address</label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            rows={3}
                            className={`${inputClass} resize-none`}
                            style={{ color: 'var(--blush-text)' }}
                            placeholder="House/flat, street, area, city, PIN code"
                        />
                        {errors.address && <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>{errors.address}</p>}
                    </div>

                    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: 'var(--blush-border)' }}>
                        <div className="flex items-center justify-between text-sm mb-1" style={{ color: 'var(--blush-text)', opacity: 0.8 }}>
                            <span>Subtotal ({items.reduce((n, i) => n + i.line.quantity, 0)} items)</span>
                            <span className="font-bold">₹{subtotal}</span>
                        </div>
                        {comboMatches.map(({ combo, amount }) => (
                            <div key={combo.id} className="flex items-center justify-between text-sm mb-1" style={{ color: 'var(--blush-rose)' }}>
                                <span>🎁 {combo.name} — {combo.discountPercent}% off</span>
                                <span className="font-bold">−₹{amount}</span>
                            </div>
                        ))}
                        {discountTotal > 0 && (
                            <div className="flex items-center justify-between text-sm font-bold pt-1 mb-1 border-t" style={{ color: 'var(--blush-text)', borderColor: 'var(--blush-border)' }}>
                                <span>Total</span>
                                <span>₹{total}</span>
                            </div>
                        )}
                        <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>Final pricing &amp; delivery confirmed over WhatsApp.</p>
                    </div>

                    {submitError && <p className="text-sm font-medium" style={{ color: 'var(--blush-rose-dark)' }}>{submitError}</p>}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                        style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
                    >
                        <Icon name="ChatBubbleLeftRightIcon" size={18} />
                        {isPending ? 'Placing your order…' : 'Enquire via WhatsApp'}
                    </button>

                    {payError && <p className="text-sm font-medium" style={{ color: 'var(--blush-rose-dark)' }}>{payError}</p>}

                    {paymentEnabled ? (
                        <button
                            type="button"
                            onClick={handlePayNow}
                            disabled={payPending}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                            style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
                        >
                            <Icon name="CreditCardIcon" size={18} />
                            {payPending ? 'Starting payment…' : `Pay Now — ₹${total}`}
                        </button>
                    ) : null}
                </form>
            </div>
            {paymentEnabled && <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />}
        </section>
    );
}
