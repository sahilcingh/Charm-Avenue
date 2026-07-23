'use client';
import React, { useState, useTransition } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { DbCombo } from '@/lib/supabase/types';
import { createCombo, updateCombo, toggleComboActive, deleteCombo } from './actions';

export interface ComboProductOption {
  id: string;
  name: string;
  price: number;
}

export interface ComboWithProducts extends DbCombo {
  productIds: string[];
}

const inputClass =
  'w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)]';
const labelClass = 'text-xs font-bold uppercase tracking-wide mb-1.5 block';

function ProductChecklist({
  products,
  selected,
  onToggle,
}: {
  products: ComboProductOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 max-h-56 overflow-y-auto rounded-2xl border p-3"
      style={{ borderColor: 'var(--blush-border)' }}
    >
      {products.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
          No active products to choose from.
        </p>
      ) : (
        products.map((product) => (
          <label
            key={product.id}
            className="flex items-center gap-2 text-sm cursor-pointer"
            style={{ color: 'var(--blush-text)' }}
          >
            <input
              type="checkbox"
              checked={selected.has(product.id)}
              onChange={() => onToggle(product.id)}
              className="accent-[var(--blush-rose)]"
            />
            {product.name}
            <span className="text-xs" style={{ color: 'var(--blush-muted)' }}>
              ₹{product.price}
            </span>
          </label>
        ))
      )}
    </div>
  );
}

function ComboRow({
  combo,
  products,
}: {
  combo: ComboWithProducts;
  products: ComboProductOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(combo.name);
  const [description, setDescription] = useState(combo.description ?? '');
  const [discountPercent, setDiscountPercent] = useState(combo.discount_percent.toString());
  const [selected, setSelected] = useState<Set<string>>(new Set(combo.productIds));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productNames = combo.productIds.map(
    (id) => products.find((p) => p.id === id)?.name ?? 'Deleted product'
  );

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    setError(null);
    const fd = new FormData();
    fd.set('name', name);
    fd.set('description', description);
    fd.set('discountPercent', discountPercent);
    selected.forEach((id) => fd.append('productIds', id));

    startTransition(async () => {
      try {
        await updateCombo(combo.id, fd);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save.');
      }
    });
  };

  return (
    <div
      className="flex flex-col gap-3 px-4 py-4 border-b last:border-0"
      style={{ borderColor: 'var(--blush-border)' }}
    >
      {editing ? (
        <>
          <div>
            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              style={{ color: 'var(--blush-text)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              style={{ color: 'var(--blush-text)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
              Discount %
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className={inputClass}
              style={{ color: 'var(--blush-text)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
              Products (select at least 2)
            </label>
            <ProductChecklist products={products} selected={selected} onToggle={toggleSelected} />
          </div>
          {error && (
            <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
              {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest text-white disabled:opacity-60"
              style={{ background: 'var(--blush-rose)' }}
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setName(combo.name);
                setDescription(combo.description ?? '');
                setDiscountPercent(combo.discount_percent.toString());
                setSelected(new Set(combo.productIds));
                setError(null);
              }}
              className="px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest"
              style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold" style={{ color: 'var(--blush-text)' }}>
                {combo.name}
              </p>
              <span
                className="badge-pill text-xs"
                style={{ background: 'var(--blush-border)', color: 'var(--blush-rose)' }}
              >
                {combo.discount_percent}% off
              </span>
            </div>
            {combo.description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--blush-muted)' }}>
                {combo.description}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--blush-muted)' }}>
              {productNames.join(' + ')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span
                className="relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-300"
                style={{
                  background: combo.is_active ? 'var(--blush-rose)' : 'var(--blush-border)',
                }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-300"
                  style={{ transform: combo.is_active ? 'translateX(18px)' : 'translateX(3px)' }}
                />
                <input
                  type="checkbox"
                  checked={combo.is_active}
                  onChange={(e) =>
                    startTransition(() => toggleComboActive(combo.id, e.target.checked))
                  }
                  className="sr-only"
                />
              </span>
            </label>
            <button
              onClick={() => setEditing(true)}
              aria-label={`Edit ${combo.name}`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose)] hover:text-white"
            >
              <Icon name="PencilSquareIcon" size={15} />
            </button>
            {confirmingDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => startTransition(() => deleteCombo(combo.id))}
                  disabled={isPending}
                  className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full text-white disabled:opacity-50"
                  style={{ background: 'var(--blush-rose-dark)' }}
                >
                  {isPending ? '…' : 'Confirm'}
                </button>
                <button
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
                onClick={() => setConfirmingDelete(true)}
                aria-label={`Delete ${combo.name}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose-dark)] hover:text-white"
              >
                <Icon name="TrashIcon" size={15} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComboManager({
  combos,
  products,
}: {
  combos: ComboWithProducts[];
  products: ComboProductOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('name', name);
    fd.set('description', description);
    fd.set('discountPercent', discountPercent);
    selected.forEach((id) => fd.append('productIds', id));

    startTransition(async () => {
      try {
        await createCombo(fd);
        setName('');
        setDescription('');
        setDiscountPercent('10');
        setSelected(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create combo.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-3xl p-6 md:p-8 border flex flex-col gap-4"
        style={{ borderColor: 'var(--blush-border)' }}
      >
        <h2 className="font-elegant-serif text-lg" style={{ color: 'var(--blush-text)' }}>
          Add a Combo
        </h2>
        <div>
          <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Earrings + Necklace"
            className={inputClass}
            style={{ color: 'var(--blush-text)' }}
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Shown to you only, not the shopper"
            className={inputClass}
            style={{ color: 'var(--blush-text)' }}
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
            Discount %
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className={inputClass}
            style={{ color: 'var(--blush-text)' }}
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
            Products (select at least 2)
          </label>
          <ProductChecklist products={products} selected={selected} onToggle={toggleSelected} />
        </div>
        {error && (
          <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending || !name.trim() || selected.size < 2}
          className="self-start px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white disabled:opacity-60"
          style={{ background: 'var(--blush-rose)' }}
        >
          {isPending ? 'Adding…' : 'Add Combo'}
        </button>
      </form>

      <div className="bg-white rounded-2xl border" style={{ borderColor: 'var(--blush-border)' }}>
        {combos.length === 0 ? (
          <p className="text-sm px-4 py-6 text-center" style={{ color: 'var(--blush-muted)' }}>
            No combos yet — add one above to offer a discount when 2+ products are bought together.
          </p>
        ) : (
          combos.map((combo) => <ComboRow key={combo.id} combo={combo} products={products} />)
        )}
      </div>
    </div>
  );
}
