'use client';
import React, { useRef, useState, useTransition } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import type { DbProductImage } from '@/lib/supabase/types';
import { validateProductImageFile } from '@/lib/product-image-validation';
import { compressProductImage } from '@/lib/compress-product-image';
import { addProductImage, removeProductImage, reorderProductImage } from './actions';

export default function AdditionalPhotosManager({
  productId,
  images,
}: {
  productId: string;
  images: DbProductImage[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [altText, setAltText] = useState('');

  function handleReorder(imageId: string, direction: 'up' | 'down') {
    setError(null);
    startTransition(async () => {
      try {
        await reorderProductImage(imageId, productId, direction);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reorder photos.');
      }
    });
  }

  function handleRemove(imageId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await removeProductImage(imageId, productId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not remove photo.');
      }
    });
  }

  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        const compressed = await compressProductImage(file);
        const validationError = validateProductImageFile(compressed);
        if (validationError) {
          setError(validationError);
          return;
        }
        const fd = new FormData();
        fd.set('imageFile', compressed);
        fd.set('alt', altText.trim());
        await addProductImage(productId, fd);
        setAltText('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not add photo.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 group"
            >
              <AppImage
                src={img.url}
                alt={img.alt}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(30,23,18,0.55)' }}
              >
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={i === 0 || isPending}
                    onClick={() => handleReorder(img.id, 'up')}
                    aria-label="Move earlier"
                    className="w-5 h-5 rounded-full bg-white flex items-center justify-center disabled:opacity-40"
                  >
                    <Icon name="ChevronLeftIcon" size={11} />
                  </button>
                  <button
                    type="button"
                    disabled={i === images.length - 1 || isPending}
                    onClick={() => handleReorder(img.id, 'down')}
                    aria-label="Move later"
                    className="w-5 h-5 rounded-full bg-white flex items-center justify-center disabled:opacity-40"
                  >
                    <Icon name="ChevronRightIcon" size={11} />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRemove(img.id)}
                  aria-label="Remove photo"
                  className="w-5 h-5 rounded-full bg-white flex items-center justify-center"
                >
                  <Icon name="TrashIcon" size={11} style={{ color: 'var(--blush-rose-dark)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <label className="flex flex-col gap-1">
        <span
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: 'var(--blush-muted)' }}
        >
          Alt text for next photo (optional)
        </span>
        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          disabled={isPending}
          placeholder="Describe the photo"
          className="w-full rounded-2xl px-4 py-2.5 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] focus:ring-2 focus:ring-[var(--blush-rose)]/15 transition-all duration-200 disabled:opacity-60"
        />
      </label>
      <button
        type="button"
        onClick={() => !isPending && fileInputRef.current?.click()}
        disabled={isPending}
        className="flex items-center gap-2 text-sm font-semibold py-1 transition-opacity hover:opacity-70 disabled:opacity-60 self-start"
        style={{ color: 'var(--blush-rose)' }}
      >
        <Icon
          name={isPending ? 'ArrowPathIcon' : 'PlusIcon'}
          size={16}
          className={isPending ? 'animate-spin' : ''}
        />
        {isPending ? 'Saving…' : 'Add another photo'}
      </button>
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
          {error}
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
