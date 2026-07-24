'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import CategoryFormModal from '../categories/CategoryFormModal';

/** A lightweight quick-add entry point for categories from within the Products admin — the full manage/edit/delete experience lives at /admin/categories. */
export default function AddCategoryButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] border"
        style={{ borderColor: 'var(--blush-border)', color: 'var(--blush-text)' }}
      >
        <Icon name="PlusIcon" size={16} />
        Add Category
      </button>
      <CategoryFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
