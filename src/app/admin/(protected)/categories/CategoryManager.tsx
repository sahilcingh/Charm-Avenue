'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import type { DbCategory } from '@/lib/supabase/types';
import CategoryFormModal from './CategoryFormModal';
import { deleteCategory } from './actions';

interface BlockingProduct {
  id: string;
  name: string;
}

interface CategoryRowProps {
  category: DbCategory;
  blockingProducts: BlockingProduct[];
  onEdit: () => void;
  onDeleted: (slug: string) => void;
}

function CategoryRow({ category, blockingProducts, onEdit, onDeleted }: CategoryRowProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showBlockers, setShowBlockers] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const blocked = blockingProducts.length > 0;

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCategory(category.slug);
        onDeleted(category.slug);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete this category.');
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <div
      className="flex flex-col gap-3 px-4 py-3 border-b last:border-0"
      style={{ borderColor: 'var(--blush-border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 min-w-0 sm:flex-1">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
            <AppImage
              src={category.image}
              alt={category.image_alt}
              width={56}
              height={56}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold tracking-tight text-sm" style={{ color: 'var(--blush-text)' }}>
              {category.emoji} {category.title}
            </p>
            <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
              {category.subtitle}
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-2 pt-2 sm:pt-0 sm:gap-3 border-t sm:border-t-0"
          style={{ borderColor: 'var(--blush-bg)' }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shrink-0"
              style={{ background: category.tag_bg, color: category.tag_text }}
            >
              {category.tag}
            </span>
            <button
              onClick={() => setShowBlockers((v) => !v)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 transition-colors duration-150"
              style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
            >
              {blockingProducts.length} product{blockingProducts.length === 1 ? '' : 's'}
            </button>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              aria-label={`Edit ${category.title}`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose-button)] hover:text-white"
            >
              <Icon name="PencilSquareIcon" size={15} />
            </button>
            {blocked ? (
              <button
                onClick={() => setShowBlockers(true)}
                aria-label={`Can't delete ${category.title}, still in use`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-border)] cursor-not-allowed"
                title="Reassign its products before deleting"
              >
                <Icon name="TrashIcon" size={15} />
              </button>
            ) : confirmingDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDelete}
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
                aria-label={`Delete ${category.title}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose-dark)] hover:text-white"
              >
                <Icon name="TrashIcon" size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
          {error}
        </p>
      )}

      {showBlockers && (
        <div
          className="rounded-2xl p-3 text-xs"
          style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
        >
          {blocked ? (
            <>
              <p className="font-semibold mb-1.5" style={{ color: 'var(--blush-text)' }}>
                Can&apos;t delete: {blockingProducts.length} product
                {blockingProducts.length === 1 ? ' uses' : 's use'} this category. Reassign{' '}
                {blockingProducts.length === 1 ? 'it' : 'them'} first:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {blockingProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/products/${p.id}`}
                    className="px-2.5 py-1 rounded-full bg-white font-semibold transition-opacity hover:opacity-70"
                    style={{ color: 'var(--blush-rose)' }}
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p>No products use this category yet. It&apos;s safe to delete.</p>
          )}
        </div>
      )}
    </div>
  );
}

interface CategoryManagerProps {
  categories: DbCategory[];
  productsByCategory: Record<string, BlockingProduct[]>;
}

export default function CategoryManager({ categories, productsByCategory }: CategoryManagerProps) {
  const [categoryList, setCategoryList] = useState(categories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DbCategory | undefined>(undefined);

  function openCreate() {
    setEditingCategory(undefined);
    setModalOpen(true);
  }

  function openEdit(category: DbCategory) {
    setEditingCategory(category);
    setModalOpen(true);
  }

  function handleSaved(saved: DbCategory) {
    setCategoryList((prev) => {
      const next = prev.some((c) => c.slug === saved.slug)
        ? prev.map((c) => (c.slug === saved.slug ? saved : c))
        : [...prev, saved];
      return [...next].sort((a, b) => a.sort_order - b.sort_order);
    });
  }

  function handleDeleted(slug: string) {
    setCategoryList((prev) => prev.filter((c) => c.slug !== slug));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1
          className="font-elegant-serif text-3xl md:text-[2.25rem]"
          style={{ color: 'var(--blush-text)' }}
        >
          Categories
        </h1>
        <button
          onClick={openCreate}
          className="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2 transition-all duration-300 hover:scale-[1.03]"
          style={{
            background: 'var(--blush-rose-button)',
            boxShadow: '0 4px 20px rgba(232,130,143,0.35)',
          }}
        >
          <Icon name="PlusIcon" size={16} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border" style={{ borderColor: 'var(--blush-border)' }}>
        {categoryList.length === 0 ? (
          <p className="text-sm px-4 py-6 text-center" style={{ color: 'var(--blush-muted)' }}>
            No categories yet. Click &quot;Add Category&quot; to create your first one.
          </p>
        ) : (
          categoryList.map((category) => (
            <CategoryRow
              key={category.slug}
              category={category}
              blockingProducts={productsByCategory[category.slug] ?? []}
              onEdit={() => openEdit(category)}
              onDeleted={handleDeleted}
            />
          ))
        )}
      </div>

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editingCategory}
        onSaved={handleSaved}
      />
    </div>
  );
}
