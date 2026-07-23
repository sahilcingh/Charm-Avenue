'use client';
import React, { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Icon from '@/components/ui/AppIcon';
import type { DbCategory, DbProduct, DbProductImage, DbProductVariant, DbTag, ProductStockStatus } from '@/lib/supabase/types';
import { TAG_STYLES, tagStyleKeyFor, type TagStyleKey } from '@/lib/supabase/types';
import { validateProductImageFile } from '@/lib/product-image-validation';
import { compressProductImage } from '@/lib/compress-product-image';
import AdditionalPhotosManager from './AdditionalPhotosManager';
import VariantsManager from './VariantsManager';

interface ProductFormProps {
    categories: DbCategory[];
    product?: DbProduct;
    images?: DbProductImage[];
    allTags?: DbTag[];
    selectedCategorySlugs?: string[];
    selectedTagSlugs?: string[];
    variants?: DbProductVariant[];
    action: (formData: FormData) => void | Promise<void>;
}

function toggleSetValue(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
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

/** The collapsed state of an opt-in section — a product that doesn't use the feature never renders anything more than this. */
function AddSectionButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 text-sm font-semibold py-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--blush-rose)' }}
        >
            <Icon name={icon} size={16} />
            {label}
        </button>
    );
}

function TurnOffLink({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-xs font-semibold hover:opacity-70 transition-opacity"
            style={{ color: 'var(--blush-muted)' }}
        >
            Turn off
        </button>
    );
}

export default function ProductForm({
    categories,
    product,
    images = [],
    allTags = [],
    selectedCategorySlugs = [],
    selectedTagSlugs = [],
    variants = [],
    action,
}: ProductFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(product?.image ?? null);
    const [dragActive, setDragActive] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [compressing, setCompressing] = useState(false);
    const [tagStyle, setTagStyle] = useState<TagStyleKey>(tagStyleKeyFor(product?.tag_bg ?? null));
    const [tagLabel, setTagLabel] = useState(product?.tag ?? '');
    const [isActive, setIsActive] = useState(product?.is_active ?? true);

    // Tracked only to drive the live preview card — the form itself still submits via native FormData.
    const [name, setName] = useState(product?.name ?? '');
    const [price, setPrice] = useState(product?.price?.toString() ?? '');
    const [originalPrice, setOriginalPrice] = useState(product?.original_price?.toString() ?? '');
    const [categorySlug, setCategorySlug] = useState(product?.category_slug ?? '');

    // Phase 1 — every section below defaults to collapsed/off for a product
    // that doesn't already use the feature, so editing an existing simple
    // product looks identical to before this phase.
    const [saleWindowOpen, setSaleWindowOpen] = useState(Boolean(product?.sale_starts_at || product?.sale_ends_at));
    const [saleStartsAt, setSaleStartsAt] = useState(product?.sale_starts_at ? product.sale_starts_at.slice(0, 10) : '');
    const [saleEndsAt, setSaleEndsAt] = useState(product?.sale_ends_at ? product.sale_ends_at.slice(0, 10) : '');

    const [trackStock, setTrackStock] = useState(Boolean(product?.stock_status));
    const [stockStatus, setStockStatus] = useState<ProductStockStatus>(product?.stock_status ?? 'in_stock');
    const [madeToOrderLeadTime, setMadeToOrderLeadTime] = useState(product?.made_to_order_lead_time ?? '');
    const [lowStockThreshold, setLowStockThreshold] = useState(product?.low_stock_threshold?.toString() ?? '');
    const [stockCount, setStockCount] = useState(product?.stock_count?.toString() ?? '');

    const [personalizationEnabled, setPersonalizationEnabled] = useState(product?.personalization_enabled ?? false);
    const [personalizationLabel, setPersonalizationLabel] = useState(product?.personalization_label ?? '');
    const [personalizationRequired, setPersonalizationRequired] = useState(product?.personalization_required ?? false);
    const [personalizationMaxLength, setPersonalizationMaxLength] = useState(product?.personalization_max_length?.toString() ?? '');

    const [moreDetailsOpen, setMoreDetailsOpen] = useState(
        Boolean(product?.dimensions || product?.material || product?.care_instructions)
    );
    const [dimensions, setDimensions] = useState(product?.dimensions ?? '');
    const [material, setMaterial] = useState(product?.material ?? '');
    const [careInstructions, setCareInstructions] = useState(product?.care_instructions ?? '');

    const [categoriesTagsOpen, setCategoriesTagsOpen] = useState(selectedCategorySlugs.length > 0 || selectedTagSlugs.length > 0);
    const [extraCategories, setExtraCategories] = useState<Set<string>>(new Set(selectedCategorySlugs));
    const [tagSelections, setTagSelections] = useState<Set<string>>(new Set(selectedTagSlugs));

    const selectedCategory = categories.find((c) => c.slug === categorySlug);
    const activeTagStyle = TAG_STYLES[tagStyle];

    async function handleFiles(files: FileList | null) {
        const file = files?.[0];
        if (!file || compressing) return;

        setFileError(null);
        setCompressing(true);
        const finalFile = await compressProductImage(file);
        setCompressing(false);

        // Only ever fires if compression itself failed AND the original was still too
        // large — the normal path silently compresses down to well under this ceiling.
        const error = validateProductImageFile(finalFile);
        if (error) {
            setFileError(error);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setPreview(URL.createObjectURL(finalFile));
        if (fileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(finalFile);
            fileInputRef.current.files = dt.files;
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
                        onClick={() => !compressing && fileInputRef.current?.click()}
                        className={`relative rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-8 px-4 transition-all duration-300 ${compressing ? 'cursor-wait' : 'cursor-pointer'}`}
                        style={{
                            borderColor: dragActive ? 'var(--blush-rose)' : 'var(--blush-border)',
                            background: dragActive ? 'var(--blush-bg)' : '#FFFFFF',
                        }}
                    >
                        {compressing ? (
                            <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--blush-bg)' }}>
                                <Icon name="ArrowPathIcon" size={22} className="animate-spin" style={{ color: 'var(--blush-rose)' }} />
                            </span>
                        ) : preview ? (
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
                                {compressing ? 'Optimizing photo…' : preview ? 'Click or drop to replace' : 'Click or drag a photo here'}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--blush-muted)' }}>
                                {compressing ? 'Just a moment' : `PNG or JPG, any size — we'll optimize it automatically`}
                            </p>
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
                    {fileError && (
                        <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
                            {fileError}
                        </p>
                    )}
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

                <SectionCard icon="🎨" title="Variants" subtitle="Optional — color/size options, each with its own price, stock, and photo" delay="delay-100">
                    {product ? (
                        <VariantsManager productId={product.id} variants={variants} />
                    ) : (
                        <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
                            Save this product first — then come back here to add variants.
                        </p>
                    )}
                </SectionCard>

                <SectionCard icon="🖼️" title="Additional Photos" subtitle="Optional — shown after the main photo on the product page" delay="delay-100">
                    {product ? (
                        <AdditionalPhotosManager productId={product.id} images={images} />
                    ) : (
                        <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
                            Save this product first — then come back here to add extra photos.
                        </p>
                    )}
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

                <SectionCard icon="🏷️" title="Categories & Tags" subtitle="Optional — show in more places, or label with tags" delay="delay-200">
                    {!categoriesTagsOpen ? (
                        <AddSectionButton
                            icon="PlusIcon"
                            label="Add extra categories or tags"
                            onClick={() => setCategoriesTagsOpen(true)}
                        />
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--blush-muted)' }}>Categories & Tags</p>
                                <TurnOffLink onClick={() => setCategoriesTagsOpen(false)} />
                            </div>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Also Show In</label>
                                {categories.filter((c) => c.slug !== categorySlug).length === 0 ? (
                                    <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>No other categories exist yet.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {categories.filter((c) => c.slug !== categorySlug).map((c) => {
                                            const checked = extraCategories.has(c.slug);
                                            return (
                                                <label
                                                    key={c.slug}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors"
                                                    style={
                                                        checked
                                                            ? { borderColor: 'var(--blush-rose)', background: 'var(--blush-bg)', color: 'var(--blush-text)' }
                                                            : { borderColor: 'var(--blush-border)', color: 'var(--blush-muted)' }
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="extraCategories"
                                                        value={c.slug}
                                                        checked={checked}
                                                        onChange={() => setExtraCategories((prev) => toggleSetValue(prev, c.slug))}
                                                        className="sr-only"
                                                    />
                                                    {c.emoji} {c.title}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Tags</label>
                                {allTags.length === 0 ? (
                                    <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
                                        No tags yet — create some from the Tags page in the admin nav.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map((t) => {
                                            const checked = tagSelections.has(t.slug);
                                            return (
                                                <label
                                                    key={t.slug}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors"
                                                    style={
                                                        checked
                                                            ? { borderColor: 'var(--blush-rose)', background: 'var(--blush-bg)', color: 'var(--blush-text)' }
                                                            : { borderColor: 'var(--blush-border)', color: 'var(--blush-muted)' }
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="tags"
                                                        value={t.slug}
                                                        checked={checked}
                                                        onChange={() => setTagSelections((prev) => toggleSetValue(prev, t.slug))}
                                                        className="sr-only"
                                                    />
                                                    {t.label}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
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

                    {originalPrice && (
                        <div className="pt-3 border-t" style={{ borderColor: 'var(--blush-border)' }}>
                            {!saleWindowOpen ? (
                                <AddSectionButton
                                    icon="CalendarDaysIcon"
                                    label="Schedule this sale to specific dates"
                                    onClick={() => setSaleWindowOpen(true)}
                                />
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--blush-muted)' }}>Sale Window</p>
                                        <TurnOffLink onClick={() => setSaleWindowOpen(false)} />
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Starts</label>
                                            <input
                                                type="date"
                                                name="saleStartsAt"
                                                value={saleStartsAt}
                                                onChange={(e) => setSaleStartsAt(e.target.value)}
                                                className={inputClass}
                                                style={{ color: 'var(--blush-text)' }}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Ends</label>
                                            <input
                                                type="date"
                                                name="saleEndsAt"
                                                value={saleEndsAt}
                                                onChange={(e) => setSaleEndsAt(e.target.value)}
                                                className={inputClass}
                                                style={{ color: 'var(--blush-text)' }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs mt-2" style={{ color: 'var(--blush-muted)' }}>
                                        Outside this window, the original price and discount badge won&apos;t be shown. The
                                        charged price is always the Price field above — update it yourself when the sale starts or ends.
                                    </p>
                                    <input type="hidden" name="scheduleSale" value="on" />
                                </>
                            )}
                        </div>
                    )}
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

                <SectionCard icon="📦" title="Stock & Availability" subtitle="Optional — separate from Visibility below" delay="delay-500">
                    {!trackStock ? (
                        <AddSectionButton
                            icon="PlusIcon"
                            label="Track stock for this product"
                            onClick={() => {
                                setTrackStock(true);
                                if (!lowStockThreshold) setLowStockThreshold('2');
                            }}
                        />
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--blush-muted)' }}>Stock tracking is on</p>
                                <TurnOffLink onClick={() => setTrackStock(false)} />
                            </div>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Status</label>
                                <select
                                    name="stockStatus"
                                    value={stockStatus}
                                    onChange={(e) => setStockStatus(e.target.value as ProductStockStatus)}
                                    className={inputClass}
                                    style={{ color: 'var(--blush-text)' }}
                                >
                                    <option value="in_stock">In Stock</option>
                                    <option value="out_of_stock">Out of Stock (temporary)</option>
                                    <option value="made_to_order">Made to Order</option>
                                    <option value="discontinued">Discontinued</option>
                                </select>
                            </div>
                            {stockStatus === 'made_to_order' && (
                                <div>
                                    <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Lead Time</label>
                                    <input
                                        type="text"
                                        name="madeToOrderLeadTime"
                                        value={madeToOrderLeadTime}
                                        onChange={(e) => setMadeToOrderLeadTime(e.target.value)}
                                        className={inputClass}
                                        style={{ color: 'var(--blush-text)' }}
                                        placeholder="e.g. Ships in 5-7 days"
                                    />
                                </div>
                            )}
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Current Stock Count</label>
                                <input
                                    type="number"
                                    name="stockCount"
                                    min={0}
                                    step={1}
                                    value={stockCount}
                                    onChange={(e) => setStockCount(e.target.value)}
                                    className={inputClass}
                                    style={{ color: 'var(--blush-text)' }}
                                    placeholder="e.g. 10"
                                />
                                <p className="text-xs mt-1.5" style={{ color: 'var(--blush-muted)' }}>
                                    Leave blank if you&apos;re not tracking an exact count.
                                </p>
                            </div>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Low-Stock Warning Threshold</label>
                                <input
                                    type="number"
                                    name="lowStockThreshold"
                                    min={0}
                                    step={1}
                                    value={lowStockThreshold}
                                    onChange={(e) => setLowStockThreshold(e.target.value)}
                                    className={inputClass}
                                    style={{ color: 'var(--blush-text)' }}
                                    placeholder="e.g. 2"
                                />
                                <p className="text-xs mt-1.5" style={{ color: 'var(--blush-muted)' }}>
                                    Shown to shoppers as &quot;only {lowStockThreshold || '2'} left&quot; once stock count drops to this number or below.
                                </p>
                            </div>
                            <input type="hidden" name="trackStock" value="on" />
                        </>
                    )}
                </SectionCard>

                <SectionCard icon="✍️" title="Personalization" subtitle="Optional — let shoppers add custom text at checkout" delay="delay-600">
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--blush-text)' }}>Allow personalization</p>
                            <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
                                {personalizationEnabled ? 'Shoppers will see a custom text field' : 'Off — no custom text field shown'}
                            </p>
                        </div>
                        <span
                            className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 shrink-0"
                            style={{ background: personalizationEnabled ? 'var(--blush-rose)' : 'var(--blush-border)' }}
                        >
                            <span
                                className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
                                style={{ transform: personalizationEnabled ? 'translateX(22px)' : 'translateX(4px)' }}
                            />
                            <input
                                type="checkbox"
                                name="personalizationEnabled"
                                checked={personalizationEnabled}
                                onChange={(e) => setPersonalizationEnabled(e.target.checked)}
                                className="sr-only"
                            />
                        </span>
                    </label>
                    {personalizationEnabled && (
                        <>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Field Label</label>
                                <input
                                    type="text"
                                    name="personalizationLabel"
                                    value={personalizationLabel}
                                    onChange={(e) => setPersonalizationLabel(e.target.value)}
                                    className={inputClass}
                                    style={{ color: 'var(--blush-text)' }}
                                    placeholder="e.g. Add your initials"
                                />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Max Length</label>
                                    <input
                                        type="number"
                                        name="personalizationMaxLength"
                                        min={1}
                                        step={1}
                                        value={personalizationMaxLength}
                                        onChange={(e) => setPersonalizationMaxLength(e.target.value)}
                                        className={inputClass}
                                        style={{ color: 'var(--blush-text)' }}
                                        placeholder="Defaults to 50"
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer pb-3">
                                    <input
                                        type="checkbox"
                                        name="personalizationRequired"
                                        checked={personalizationRequired}
                                        onChange={(e) => setPersonalizationRequired(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium" style={{ color: 'var(--blush-text)' }}>Required before adding to bag</span>
                                </label>
                            </div>
                        </>
                    )}
                </SectionCard>

                <SectionCard icon="📐" title="More Details" subtitle="Optional — dimensions, material, care" delay="delay-700">
                    {!moreDetailsOpen ? (
                        <AddSectionButton
                            icon="PlusIcon"
                            label="Add dimensions, material, or care instructions"
                            onClick={() => setMoreDetailsOpen(true)}
                        />
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--blush-muted)' }}>More details</p>
                                <TurnOffLink onClick={() => setMoreDetailsOpen(false)} />
                            </div>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Dimensions</label>
                                <input
                                    type="text"
                                    name="dimensions"
                                    value={dimensions}
                                    onChange={(e) => setDimensions(e.target.value)}
                                    className={inputClass}
                                    style={{ color: 'var(--blush-text)' }}
                                    placeholder="e.g. 5cm x 3cm"
                                />
                            </div>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Material</label>
                                <input
                                    type="text"
                                    name="material"
                                    value={material}
                                    onChange={(e) => setMaterial(e.target.value)}
                                    className={inputClass}
                                    style={{ color: 'var(--blush-text)' }}
                                    placeholder="e.g. Sterling silver"
                                />
                            </div>
                            <div>
                                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>Care Instructions</label>
                                <textarea
                                    name="careInstructions"
                                    rows={2}
                                    value={careInstructions}
                                    onChange={(e) => setCareInstructions(e.target.value)}
                                    className={`${inputClass} resize-none`}
                                    style={{ color: 'var(--blush-text)' }}
                                    placeholder="e.g. Keep dry, avoid perfume contact"
                                />
                            </div>
                        </>
                    )}
                </SectionCard>

                <SectionCard icon="👁️" title="Visibility" delay="delay-800">
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

                <div className="animate-enter delay-800">
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
