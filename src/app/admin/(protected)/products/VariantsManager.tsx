'use client';
import React, { useRef, useState, useTransition } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { DbProductVariant, ProductStockStatus } from '@/lib/supabase/types';
import { addVariant, updateVariant, removeVariant } from './actions';

const STOCK_OPTIONS: { value: '' | ProductStockStatus; label: string }[] = [
  { value: '', label: 'Not set' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'made_to_order', label: 'Made to Order' },
  { value: 'discontinued', label: 'Discontinued' },
];

const fieldClass =
  'w-full rounded-xl px-2.5 py-2 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)]';
const fieldLabelClass = 'text-[10px] font-bold uppercase tracking-wide mb-1 block';

function VariantRow({ variant, productId }: { variant: DbProductVariant; productId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState(variant.color ?? '');
  const [size, setSize] = useState(variant.size ?? '');
  const [priceOverride, setPriceOverride] = useState(variant.price_override?.toString() ?? '');
  const [stockStatus, setStockStatus] = useState<'' | ProductStockStatus>(
    variant.stock_status ?? ''
  );
  const [stockCount, setStockCount] = useState(variant.stock_count?.toString() ?? '');
  const [preview, setPreview] = useState<string | null>(variant.image);
  const [isActive, setIsActive] = useState(variant.is_active);
  const [dirty, setDirty] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    const fd = new FormData();
    fd.set('color', color);
    fd.set('size', size);
    fd.set('priceOverride', priceOverride);
    fd.set('stockStatus', stockStatus);
    fd.set('stockCount', stockCount);
    fd.set('isActive', isActive ? 'on' : 'off');
    const file = fileInputRef.current?.files?.[0];
    if (file) fd.set('imageFile', file);

    startTransition(async () => {
      try {
        await updateVariant(variant.id, productId, fd);
        setDirty(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save.');
      }
    });
  };

  function handleImagePick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setDirty(true);
  }

  return (
    <div
      className="flex flex-wrap items-end gap-3 p-3 rounded-2xl border"
      style={{ borderColor: 'var(--blush-border)' }}
    >
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Change variant photo"
        className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border"
        style={{ borderColor: 'var(--blush-border)', background: 'var(--blush-bg)' }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="PhotoIcon" size={16} style={{ color: 'var(--blush-border)' }} />
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImagePick(e.target.files)}
      />

      <div className="w-24">
        <label className={fieldLabelClass} style={{ color: 'var(--blush-muted)' }}>
          Color
        </label>
        <input
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setDirty(true);
          }}
          className={fieldClass}
          style={{ color: 'var(--blush-text)' }}
          placeholder="Red"
        />
      </div>
      <div className="w-20">
        <label className={fieldLabelClass} style={{ color: 'var(--blush-muted)' }}>
          Size
        </label>
        <input
          value={size}
          onChange={(e) => {
            setSize(e.target.value);
            setDirty(true);
          }}
          className={fieldClass}
          style={{ color: 'var(--blush-text)' }}
          placeholder="M"
        />
      </div>
      <div className="w-24">
        <label className={fieldLabelClass} style={{ color: 'var(--blush-muted)' }}>
          Price (₹)
        </label>
        <input
          type="number"
          value={priceOverride}
          onChange={(e) => {
            setPriceOverride(e.target.value);
            setDirty(true);
          }}
          className={fieldClass}
          style={{ color: 'var(--blush-text)' }}
          placeholder="Same"
        />
      </div>
      <div className="w-36">
        <label className={fieldLabelClass} style={{ color: 'var(--blush-muted)' }}>
          Stock
        </label>
        <select
          value={stockStatus}
          onChange={(e) => {
            setStockStatus(e.target.value as '' | ProductStockStatus);
            setDirty(true);
          }}
          className={fieldClass}
          style={{ color: 'var(--blush-text)' }}
        >
          {STOCK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="w-20">
        <label className={fieldLabelClass} style={{ color: 'var(--blush-muted)' }}>
          Count
        </label>
        <input
          type="number"
          value={stockCount}
          onChange={(e) => {
            setStockCount(e.target.value);
            setDirty(true);
          }}
          className={fieldClass}
          style={{ color: 'var(--blush-text)' }}
          placeholder="—"
        />
      </div>

      <label className="flex flex-col items-center gap-1 cursor-pointer">
        <span className={fieldLabelClass} style={{ color: 'var(--blush-muted)' }}>
          Active
        </span>
        <span
          className="relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-300 shrink-0"
          style={{ background: isActive ? 'var(--blush-rose)' : 'var(--blush-border)' }}
        >
          <span
            className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-300"
            style={{ transform: isActive ? 'translateX(18px)' : 'translateX(3px)' }}
          />
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => {
              setIsActive(e.target.checked);
              setDirty(true);
            }}
            className="sr-only"
          />
        </span>
      </label>

      <div className="flex items-center gap-1.5 ml-auto">
        {dirty && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            aria-label="Save variant"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-60"
            style={{ background: 'var(--blush-rose)' }}
          >
            <Icon name="CheckIcon" size={14} />
          </button>
        )}
        {confirmingDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => startTransition(() => removeVariant(variant.id, productId))}
              disabled={isPending}
              className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full text-white disabled:opacity-50"
              style={{ background: 'var(--blush-rose-dark)' }}
            >
              {isPending ? '…' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              aria-label="Cancel delete"
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
            >
              <Icon name="XMarkIcon" size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Remove variant"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose-dark)] hover:text-white"
          >
            <Icon name="TrashIcon" size={14} />
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium w-full" style={{ color: 'var(--blush-rose-dark)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function VariantsManager({
  productId,
  variants,
}: {
  productId: string;
  variants: DbProductVariant[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setError(null);
    startTransition(async () => {
      try {
        await addVariant(productId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not add variant.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {variants.map((v) => (
        <VariantRow key={v.id} variant={v} productId={productId} />
      ))}
      <button
        type="button"
        onClick={handleAdd}
        disabled={isPending}
        className="flex items-center gap-2 text-sm font-semibold py-1 self-start disabled:opacity-60 transition-opacity hover:opacity-70"
        style={{ color: 'var(--blush-rose)' }}
      >
        <Icon
          name={isPending ? 'ArrowPathIcon' : 'PlusIcon'}
          size={16}
          className={isPending ? 'animate-spin' : ''}
        />
        {isPending ? 'Adding…' : 'Add a variant'}
      </button>
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
