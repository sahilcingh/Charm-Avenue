'use client';
import React, { useRef, useState, useTransition } from 'react';
import Icon from '@/components/ui/AppIcon';
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
        fd.set('alt', '');
        await addProductImage(productId, fd);
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(30,23,18,0.55)' }}
              >
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={i === 0 || isPending}
                    onClick={() =>
                      startTransition(() => reorderProductImage(img.id, productId, 'up'))
                    }
                    aria-label="Move earlier"
                    className="w-5 h-5 rounded-full bg-white flex items-center justify-center disabled:opacity-40"
                  >
                    <Icon name="ChevronLeftIcon" size={11} />
                  </button>
                  <button
                    type="button"
                    disabled={i === images.length - 1 || isPending}
                    onClick={() =>
                      startTransition(() => reorderProductImage(img.id, productId, 'down'))
                    }
                    aria-label="Move later"
                    className="w-5 h-5 rounded-full bg-white flex items-center justify-center disabled:opacity-40"
                  >
                    <Icon name="ChevronRightIcon" size={11} />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => removeProductImage(img.id, productId))}
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
