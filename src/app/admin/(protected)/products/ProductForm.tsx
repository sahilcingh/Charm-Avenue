'use client';
import React, { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Icon from '@/components/ui/AppIcon';
import type { DbCategory, DbProduct } from '@/lib/supabase/types';
import { TAG_STYLES, tagStyleKeyFor, type TagStyleKey } from '@/lib/supabase/types';

interface ProductFormProps {
    categories: DbCategory[];
    product?: DbProduct;
    action: (formData: FormData) => void | Promise<void>;
}

const inputClass =
    'w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] focus:ring-2 focus:ring-[var(--blush-rose)]/15 transition-all duration-200';
const labelClass = 'text-xs font-bold uppercase tracking-wide mb-1.5 block';

function SubmitButton({ isEdit }: { isEdit: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full sm:w-auto px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100 ${pending ? '' : 'animate-pulse-glow'}`}
            style={{ background: 'var(--blush-rose)', boxShadow: '0 6px 24px rgba(232,130,143,0.4)' }}
        >
            {pending ? (
                <>
                    <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                    Saving…
                </>
            ) : (
                <>
                    <Icon name={isEdit ? 'CheckIcon' : 'SparklesIcon'} size={16} />
                    {isEdit ? 'Save Changes' : 'Create Product'}
                </>
            )}
        </button>
    );
}

function SectionCard({
    icon,
    title,
    subtitle,
    delay,
    children,
}: {
    icon: string;
    title: string;
    subtitle?: string;
    delay: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`bg-white rounded-3xl p-6 md:p-7 card-bubble animate-enter ${delay}`}>
            <div className="flex items-center gap-2.5 mb-5">
                <span
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
                    style={{ background: 'var(--blush-bg)' }}
                >
                    {icon}
                </span>
                <div>
                    <h2 className="font-bold text-sm" style={{ color: 'var(--blush-text)' }}>{title}</h2>
                    {subtitle && <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>{subtitle}</p>}
                </div>
            </div>
            <div className="flex flex-col gap-4">{children}</div>
        </div>
    );
}

export default function ProductForm({ categories, product, action }: ProductFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(product?.image ?? null);
    const [dragActive, setDragActive] = useState(false);
    const [tagStyle, setTagStyle] = useState<TagStyleKey>(tagStyleKeyFor(product?.tag_bg ?? null));
    const [tagLabel, setTagLabel] = useState(product?.tag ?? '');
    const [isActive, setIsActive] = useState(product?.is_active ?? true);

    // Tracked only to drive the live preview card — the form itself still submits via native FormData.
    const [name, setName] = useState(product?.name ?? '');
    const [price, setPrice] = useState(product?.price?.toString() ?? '');
    const [originalPrice, setOriginalPrice] = useState(product?.original_price?.toString() ?? '');
    const [categorySlug, setCategorySlug] = useState(product?.category_slug ?? '');

    const selectedCategory = categories.find((c) => c.slug === categorySlug);
    const activeTagStyle = TAG_STYLES[tagStyle];

    function handleFiles(files: FileList | null) {
        const file = files?.[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        if (fileInputRef.current && files !== fileInputRef.current.files) {
            fileInputRef.current.files = files;
        }
    }

    return (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18.75rem)] gap-6 items-start">
            <form action={action} className="flex flex-col gap-5">
                <SectionCard icon="📸" title="Product Photo" delay="delay-100">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragActive(false);
                            handleFiles(e.dataTransfer.files);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className="relative rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-8 px-4 cursor-pointer transition-all duration-300"
                        style={{
                            borderColor: dragActive ? 'var(--blush-rose)' : 'var(--blush-border)',
                            background: dragActive ? 'var(--blush-bg)' : '#FFFFFF',
                        }}
                    >
                        {preview ? (
                            <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-md group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{ background: 'rgba(30,23,18,0.5)' }}
                                >
                                    <Icon name="CameraIcon" size={20} className="text-white" />
                                </div>
                            </div>
                        ) : (
                            <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--blush-bg)' }}>
                                <Icon name="ArrowUpTrayIcon" size={22} style={{ color: 'var(--blush-rose)' }} />
                            </span>
                        )}
                        <div className="text-center">
                            <p className="text-sm font-bold" style={{ color: 'var(--blush-text)' }}>
                                {preview ? 'Click or drop to replace' : 'Click or drag a photo here'}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--blush-muted)' }}>PNG or JPG, up to ~5MB</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="imageFile"
                            accept="image/*"
                            required={!product}
                            onChange={(e) => handleFiles(e.target.files)}
                            className="hidden"
                        />
                    </div>
                    {product && (
                        <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
                            Leave empty to keep the current photo.
                        </p>
                    )}
                    <div>
                        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Alt Text (for accessibility &amp; SEO)</label>
                        <input type="text" name="imageAlt" defaultValue={product?.image_alt} className={inputClass} style={{ color: 'var(--blush-text)' }} placeholder="Describe the photo" />
                    </div>
                </SectionCard>

                <SectionCard icon="📝" title="Details" delay="delay-200">
                    <div>
                        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Product Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                            style={{ color: 'var(--blush-text)' }}
                            placeholder="Dainty Star Ring"
                        />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Category</label>
                            <select
                                name="categorySlug"
                                required
                                value={categorySlug}
                                onChange={(e) => setCategorySlug(e.target.value)}
                                className={inputClass}
                                style={{ color: 'var(--blush-text)' }}
                            >
                                <option value="" disabled>Choose a category</option>
                                {categories.map((c) => (
                                    <option key={c.slug} value={c.slug}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Emoji</label>
                            <input type="text" name="emoji" defaultValue={product?.emoji ?? '✨'} className={inputClass} style={{ color: 'var(--blush-text)' }} maxLength={4} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Description</label>
                        <textarea name="description" required rows={4} defaultValue={product?.description} className={`${inputClass} resize-none`} style={{ color: 'var(--blush-text)' }} />
                    </div>
                </SectionCard>

                <SectionCard icon="💰" title="Pricing" delay="delay-300">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                required
                                min={0}
                                step={1}
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className={inputClass}
                                style={{ color: 'var(--blush-text)' }}
                            />
                        </div>
                        <div>
                            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Original Price (₹) — optional</label>
                            <input
                                type="number"
                                name="originalPrice"
                                min={0}
                                step={1}
                                value={originalPrice}
                                onChange={(e) => setOriginalPrice(e.target.value)}
                                className={inputClass}
                                style={{ color: 'var(--blush-text)' }}
                                placeholder="Leave empty if not on sale"
                            />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard icon="🏷️" title="Badge & Rating" delay="delay-400">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Badge Style</label>
                            <select
                                name="tagStyle"
                                value={tagStyle}
                                onChange={(e) => setTagStyle(e.target.value as TagStyleKey)}
                                className={inputClass}
                                style={{ color: 'var(--blush-text)' }}
                            >
                                {Object.entries(TAG_STYLES).map(([key, v]) => (
                                    <option key={key} value={key}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        {tagStyle !== 'none' && (
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Badge Text</label>
                                <input
                                    type="text"
                                    name="tagLabel"
                                    value={tagLabel}
                                    onChange={(e) => setTagLabel(e.target.value)}
                                    className={inputClass}
                                    style={{ color: 'var(--blush-text)' }}
                                    placeholder="Hot 🔥"
                                />
                            </div>
                        )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Rating (1–5)</label>
                            <input type="number" name="rating" min={1} max={5} step={0.1} defaultValue={product?.rating ?? 4.5} className={inputClass} style={{ color: 'var(--blush-text)' }} />
                        </div>
                        <div>
                            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Review Count</label>
                            <input type="number" name="reviewCount" min={0} step={1} defaultValue={product?.review_count ?? 0} className={inputClass} style={{ color: 'var(--blush-text)' }} />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard icon="👁️" title="Visibility" delay="delay-500">
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--blush-text)' }}>Show on storefront</p>
                            <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
                                {isActive ? 'Visible to shoppers right away' : 'Saved as a hidden draft'}
                            </p>
                        </div>
                        <span
                            className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 shrink-0"
                            style={{ background: isActive ? 'var(--blush-rose)' : 'var(--blush-border)' }}
                        >
                            <span
                                className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
                                style={{ transform: isActive ? 'translateX(22px)' : 'translateX(4px)' }}
                            />
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="sr-only"
                            />
                        </span>
                    </label>
                </SectionCard>

                <div className="animate-enter delay-600">
                    <SubmitButton isEdit={Boolean(product)} />
                </div>
            </form>

            {/* Live preview */}
            <div className="animate-enter delay-300 lg:sticky lg:top-24">
                <div className="flex items-center gap-2 mb-3">
                    <Icon name="EyeIcon" size={16} style={{ color: 'var(--blush-rose)' }} />
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--blush-muted)' }}>Live Preview</p>
                </div>
                <div className="bg-white rounded-3xl overflow-hidden card-bubble max-w-[17.5rem]">
                    <div className="relative aspect-square" style={{ background: 'var(--blush-bg)' }}>
                        {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Icon name="PhotoIcon" size={32} style={{ color: 'var(--blush-border)' }} />
                            </div>
                        )}
                        {tagStyle !== 'none' && tagLabel && (
                            <span
                                className="absolute top-2 left-2 badge-pill text-xs shadow-sm"
                                style={{ background: activeTagStyle.tagBg ?? undefined, color: activeTagStyle.tagText ?? undefined }}
                            >
                                {tagLabel}
                            </span>
                        )}
                        {!isActive && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(30,23,18,0.55)' }}>
                                <span className="badge-pill bg-white text-xs" style={{ color: 'var(--blush-text)' }}>Hidden</span>
                            </div>
                        )}
                    </div>
                    <div className="p-3">
                        <p className="text-xs font-medium mb-0.5 truncate" style={{ color: 'var(--blush-muted)' }}>
                            {selectedCategory?.title ?? 'Category'}
                        </p>
                        <p className="font-bold text-sm mb-1.5 truncate" style={{ color: 'var(--blush-text)' }}>
                            {name || 'Product name'}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <span className="font-elegant-serif font-bold text-base" style={{ color: 'var(--blush-rose)' }}>
                                ₹{price || '0'}
                            </span>
                            {originalPrice && (
                                <span className="text-xs line-through" style={{ color: 'var(--blush-muted)' }}>₹{originalPrice}</span>
                            )}
                        </div>
                    </div>
                </div>
                <p className="text-xs mt-3 max-w-[17.5rem]" style={{ color: 'var(--blush-muted)' }}>
                    This is roughly how the card will look on the Shop page.
                </p>
            </div>
        </div>
    );
}
