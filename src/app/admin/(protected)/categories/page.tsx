import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import type { DbCategory } from '@/lib/supabase/types';
import CategoryManager from './CategoryManager';

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories, error }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('products').select('id, name, category_slug'),
  ]);

  const productsByCategory: Record<string, { id: string; name: string }[]> = {};
  for (const product of products ?? []) {
    const bucket = (productsByCategory[product.category_slug] ??= []);
    bucket.push({ id: product.id, name: product.name });
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 card-bubble flex items-start gap-4 animate-enter">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--blush-bg)' }}
        >
          <Icon
            name="ExclamationTriangleIcon"
            size={18}
            style={{ color: 'var(--blush-rose-dark)' }}
          />
        </span>
        <p className="text-sm" style={{ color: 'var(--blush-rose-dark)' }}>
          Couldn&apos;t load categories: {error.message}.
        </p>
      </div>
    );
  }

  return (
    <CategoryManager
      categories={(categories ?? []) as DbCategory[]}
      productsByCategory={productsByCategory}
    />
  );
}
