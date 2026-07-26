'use client';
import React, { useState, useTransition } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { DbHomepageSection, HomepageSectionLayout } from '@/lib/supabase/types';
import { createSection, updateSection, deleteSection, reorderSection } from './actions';

export interface SectionProductOption {
  id: string;
  name: string;
  price: number;
}

export interface SectionWithProducts extends DbHomepageSection {
  productIds: string[];
}

const inputClass =
  'w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)]';
const labelClass = 'text-xs font-bold uppercase tracking-wide mb-1.5 block';

function OrderedProductPicker({
  products,
  selected,
  onChange,
}: {
  products: SectionProductOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const selectedSet = new Set(selected);
  const available = products.filter((p) => !selectedSet.has(p.id));
  const byId = new Map(products.map((p) => [p.id, p]));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-col gap-1.5 max-h-56 overflow-y-auto rounded-2xl border p-3"
        style={{ borderColor: 'var(--blush-border)' }}
      >
        {selected.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
            No products yet — add some below.
          </p>
        ) : (
          selected.map((id, i) => {
            const product = byId.get(id);
            const label = product?.name ?? 'Deleted product';
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate" style={{ color: 'var(--blush-text)' }}>
                  {label}
                </span>
                {product && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--blush-muted)' }}>
                    ₹{product.price}
                  </span>
                )}
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={`Move ${label} earlier`}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  <Icon name="ChevronUpIcon" size={13} />
                </button>
                <button
                  type="button"
                  disabled={i === selected.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move ${label} later`}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  <Icon name="ChevronDownIcon" size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((s) => s !== id))}
                  aria-label={`Remove ${label}`}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ color: 'var(--blush-rose-dark)' }}
                >
                  <Icon name="XMarkIcon" size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
      {available.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onChange([...selected, e.target.value]);
          }}
          className={inputClass}
          style={{ color: 'var(--blush-text)' }}
        >
          <option value="">+ Add a product…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ₹{p.price}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function SectionFields({
  title,
  setTitle,
  eyebrowEmoji,
  setEyebrowEmoji,
  eyebrowLabel,
  setEyebrowLabel,
  subtitle,
  setSubtitle,
  layout,
  setLayout,
  selected,
  setSelected,
  products,
}: {
  title: string;
  setTitle: (v: string) => void;
  eyebrowEmoji: string;
  setEyebrowEmoji: (v: string) => void;
  eyebrowLabel: string;
  setEyebrowLabel: (v: string) => void;
  subtitle: string;
  setSubtitle: (v: string) => void;
  layout: HomepageSectionLayout;
  setLayout: (v: HomepageSectionLayout) => void;
  selected: string[];
  setSelected: (v: string[]) => void;
  products: SectionProductOption[];
}) {
  return (
    <>
      <div>
        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
          Section Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Impulse Buys You Need"
          className={inputClass}
          style={{ color: 'var(--blush-text)' }}
        />
      </div>
      <div className="grid sm:grid-cols-[5rem_1fr] gap-3">
        <div>
          <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
            Emoji
          </label>
          <input
            type="text"
            value={eyebrowEmoji}
            onChange={(e) => setEyebrowEmoji(e.target.value)}
            className={inputClass}
            style={{ color: 'var(--blush-text)' }}
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
            Eyebrow Label
          </label>
          <input
            type="text"
            value={eyebrowLabel}
            onChange={(e) => setEyebrowLabel(e.target.value)}
            placeholder="e.g. Budget Friendly"
            className={inputClass}
            style={{ color: 'var(--blush-text)' }}
          />
        </div>
      </div>
      <div>
        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
          Subtitle (optional)
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g. Because cute shouldn't cost a fortune."
          className={inputClass}
          style={{ color: 'var(--blush-text)' }}
        />
      </div>
      <div>
        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
          Layout
        </label>
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value as HomepageSectionLayout)}
          className={inputClass}
          style={{ color: 'var(--blush-text)' }}
        >
          <option value="grid">Grid</option>
          <option value="carousel">Scrolling carousel</option>
        </select>
      </div>
      <div>
        <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
          Products (in display order)
        </label>
        <OrderedProductPicker products={products} selected={selected} onChange={setSelected} />
      </div>
    </>
  );
}

function SectionRow({
  section,
  products,
  isFirst,
  isLast,
}: {
  section: SectionWithProducts;
  products: SectionProductOption[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [eyebrowEmoji, setEyebrowEmoji] = useState(section.eyebrow_emoji);
  const [eyebrowLabel, setEyebrowLabel] = useState(section.eyebrow_label);
  const [subtitle, setSubtitle] = useState(section.subtitle ?? '');
  const [layout, setLayout] = useState<HomepageSectionLayout>(section.layout);
  const [selected, setSelected] = useState<string[]>(section.productIds);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productNames = section.productIds.map(
    (id) => products.find((p) => p.id === id)?.name ?? 'Deleted product'
  );

  const resetToSaved = () => {
    setTitle(section.title);
    setEyebrowEmoji(section.eyebrow_emoji);
    setEyebrowLabel(section.eyebrow_label);
    setSubtitle(section.subtitle ?? '');
    setLayout(section.layout);
    setSelected(section.productIds);
    setError(null);
  };

  const handleSave = () => {
    setError(null);
    const fd = new FormData();
    fd.set('title', title);
    fd.set('eyebrowEmoji', eyebrowEmoji);
    fd.set('eyebrowLabel', eyebrowLabel);
    fd.set('subtitle', subtitle);
    fd.set('layout', layout);
    selected.forEach((id) => fd.append('productIds', id));

    startTransition(async () => {
      try {
        await updateSection(section.id, fd);
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
          <SectionFields
            title={title}
            setTitle={setTitle}
            eyebrowEmoji={eyebrowEmoji}
            setEyebrowEmoji={setEyebrowEmoji}
            eyebrowLabel={eyebrowLabel}
            setEyebrowLabel={setEyebrowLabel}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            layout={layout}
            setLayout={setLayout}
            selected={selected}
            setSelected={setSelected}
            products={products}
          />
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
              style={{ background: 'var(--blush-rose-button)' }}
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                resetToSaved();
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
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold" style={{ color: 'var(--blush-text)' }}>
                {eyebrowEmoji} {section.title}
              </p>
              <span
                className="badge-pill text-xs"
                style={{ background: 'var(--blush-border)', color: 'var(--blush-rose)' }}
              >
                {section.layout === 'carousel' ? 'Carousel' : 'Grid'}
              </span>
            </div>
            {section.subtitle && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--blush-muted)' }}>
                {section.subtitle}
              </p>
            )}
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--blush-muted)' }}>
              {productNames.length > 0 ? productNames.join(', ') : 'No products yet'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isFirst || isPending}
              onClick={() => startTransition(() => reorderSection(section.id, 'up'))}
              aria-label={`Move ${section.title} earlier`}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
              style={{ color: 'var(--blush-muted)' }}
            >
              <Icon name="ChevronUpIcon" size={15} />
            </button>
            <button
              type="button"
              disabled={isLast || isPending}
              onClick={() => startTransition(() => reorderSection(section.id, 'down'))}
              aria-label={`Move ${section.title} later`}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
              style={{ color: 'var(--blush-muted)' }}
            >
              <Icon name="ChevronDownIcon" size={15} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${section.title}`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose-button)] hover:text-white"
            >
              <Icon name="PencilSquareIcon" size={15} />
            </button>
            {confirmingDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startTransition(() => deleteSection(section.id))}
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
                aria-label={`Delete ${section.title}`}
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

export default function HomepageSectionsManager({
  sections,
  products,
}: {
  sections: SectionWithProducts[];
  products: SectionProductOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [eyebrowEmoji, setEyebrowEmoji] = useState('✨');
  const [eyebrowLabel, setEyebrowLabel] = useState('Featured');
  const [subtitle, setSubtitle] = useState('');
  const [layout, setLayout] = useState<HomepageSectionLayout>('grid');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('title', title);
    fd.set('eyebrowEmoji', eyebrowEmoji);
    fd.set('eyebrowLabel', eyebrowLabel);
    fd.set('subtitle', subtitle);
    fd.set('layout', layout);
    selected.forEach((id) => fd.append('productIds', id));

    startTransition(async () => {
      try {
        await createSection(fd);
        setTitle('');
        setEyebrowEmoji('✨');
        setEyebrowLabel('Featured');
        setSubtitle('');
        setLayout('grid');
        setSelected([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create section.');
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
          Add a Section
        </h2>
        <SectionFields
          title={title}
          setTitle={setTitle}
          eyebrowEmoji={eyebrowEmoji}
          setEyebrowEmoji={setEyebrowEmoji}
          eyebrowLabel={eyebrowLabel}
          setEyebrowLabel={setEyebrowLabel}
          subtitle={subtitle}
          setSubtitle={setSubtitle}
          layout={layout}
          setLayout={setLayout}
          selected={selected}
          setSelected={setSelected}
          products={products}
        />
        {error && (
          <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="self-start px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white disabled:opacity-60"
          style={{ background: 'var(--blush-rose-button)' }}
        >
          {isPending ? 'Adding…' : 'Add Section'}
        </button>
      </form>

      <div className="bg-white rounded-2xl border" style={{ borderColor: 'var(--blush-border)' }}>
        {sections.length === 0 ? (
          <p className="text-sm px-4 py-6 text-center" style={{ color: 'var(--blush-muted)' }}>
            No homepage sections yet — add one above.
          </p>
        ) : (
          sections.map((section, i) => (
            <SectionRow
              key={section.id}
              section={section}
              products={products}
              isFirst={i === 0}
              isLast={i === sections.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
