'use client';
import React, { useRef, useState, useTransition } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { DbCategory } from '@/lib/supabase/types';
import { TAG_STYLES, tagStyleKeyFor, type TagStyleKey } from '@/lib/supabase/types';
import { validateProductImageFile } from '@/lib/product-image-validation';
import { compressProductImage } from '@/lib/compress-product-image';
import { createCategory, updateCategory } from './actions';

const CATEGORY_TAG_STYLES = Object.entries(TAG_STYLES).filter(([key]) => key !== 'none') as [
  Exclude<TagStyleKey, 'none'>,
  (typeof TAG_STYLES)[TagStyleKey],
][];

const inputClass =
  'w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] focus:ring-2 focus:ring-[var(--blush-rose)]/15 transition-all duration-200';
const labelClass = 'text-xs font-bold uppercase tracking-wide mb-1.5 block';

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  category?: DbCategory;
  onSaved: (category: DbCategory) => void;
}

export default function CategoryFormModal({
  open,
  onClose,
  category,
  onSaved,
}: CategoryFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(category?.image ?? null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [tagStyle, setTagStyle] = useState<TagStyleKey>(
    category ? tagStyleKeyFor(category.tag_bg) : 'rose'
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || compressing) return;

    setFileError(null);
    setCompressing(true);
    const finalFile = await compressProductImage(file);
    setCompressing(false);

    const validationError = validateProductImageFile(finalFile);
    if (validationError) {
      setFileError(validationError);
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

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const saved = category
          ? await updateCategory(category.slug, formData)
          : await createCategory(formData);
        onSaved(saved);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save this category.');
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(30,23,18,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg my-8 p-6 md:p-7 flex flex-col gap-4 max-h-[calc(100vh-4rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-elegant-serif text-xl" style={{ color: 'var(--blush-text)' }}>
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
          >
            <Icon name="XMarkIcon" size={16} />
          </button>
        </div>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => !compressing && fileInputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6 px-4 transition-all duration-300 ${compressing ? 'cursor-wait' : 'cursor-pointer'}`}
            style={{
              borderColor: dragActive ? 'var(--blush-rose)' : 'var(--blush-border)',
              background: dragActive ? 'var(--blush-bg)' : '#FFFFFF',
            }}
          >
            {compressing ? (
              <Icon
                name="ArrowPathIcon"
                size={20}
                className="animate-spin"
                style={{ color: 'var(--blush-rose)' }}
              />
            ) : preview ? (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <Icon name="ArrowUpTrayIcon" size={20} style={{ color: 'var(--blush-rose)' }} />
            )}
            <p className="text-xs font-bold text-center" style={{ color: 'var(--blush-text)' }}>
              {compressing
                ? 'Optimizing photo…'
                : preview
                  ? 'Click or drop to replace'
                  : 'Click or drag a photo here'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              name="imageFile"
              accept="image/*"
              required={!category}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </div>
          {fileError && (
            <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
              {fileError}
            </p>
          )}

          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <div>
              <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
                Name
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={category?.title}
                className={inputClass}
                style={{ color: 'var(--blush-text)' }}
                placeholder="Anti-Tarnish Jewellery"
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
                Emoji
              </label>
              <input
                type="text"
                name="emoji"
                defaultValue={category?.emoji ?? '✨'}
                maxLength={4}
                className={inputClass}
                style={{ color: 'var(--blush-text)' }}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
              Subtitle
            </label>
            <input
              type="text"
              name="subtitle"
              required
              defaultValue={category?.subtitle}
              className={inputClass}
              style={{ color: 'var(--blush-text)' }}
              placeholder="Rings · Bracelets · Neckchains"
            />
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
              Description
            </label>
            <textarea
              name="description"
              required
              rows={3}
              defaultValue={category?.description}
              className={`${inputClass} resize-none`}
              style={{ color: 'var(--blush-text)' }}
            />
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
              Badge Label
            </label>
            <input
              type="text"
              name="tagLabel"
              required
              defaultValue={category?.tag}
              className={inputClass}
              style={{ color: 'var(--blush-text)' }}
              placeholder="Best Seller"
            />
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
              Badge Color
            </label>
            <input type="hidden" name="tagStyle" value={tagStyle} />
            <div className="flex gap-2">
              {CATEGORY_TAG_STYLES.map(([key, style]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTagStyle(key)}
                  aria-pressed={tagStyle === key}
                  className="flex-1 rounded-xl px-2 py-2.5 text-xs font-bold border-2 transition-all"
                  style={{
                    background: style.tagBg ?? undefined,
                    color: style.tagText ?? undefined,
                    borderColor: tagStyle === key ? 'var(--blush-text)' : 'transparent',
                  }}
                >
                  {style.label.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
              Sort Order
            </label>
            <input
              type="number"
              name="sortOrder"
              defaultValue={category?.sort_order ?? 0}
              className={inputClass}
              style={{ color: 'var(--blush-text)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--blush-muted)' }}>
              Lower numbers show first on the homepage &amp; shop page.
            </p>
          </div>

          {error && (
            <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              background: 'var(--blush-rose)',
              boxShadow: '0 4px 20px rgba(232,130,143,0.35)',
            }}
          >
            {isPending ? (
              <>
                <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                Saving…
              </>
            ) : category ? (
              'Save Changes'
            ) : (
              'Create Category'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
