import { createClient } from '@/lib/supabase/server';
import type { DbCategory, DbTag } from '@/lib/supabase/types';
import ProductForm from '../ProductForm';
import { createProduct } from '../actions';

export default async function NewProductPage() {
    const supabase = await createClient();
    const [{ data: categories }, { data: allTags }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('tags').select('*').order('label', { ascending: true }),
    ]);

    return (
        <div>
            <h1 className="font-elegant-serif text-2xl md:text-3xl mb-6" style={{ color: 'var(--blush-text)' }}>
                Add Product
            </h1>
            <ProductForm
                categories={(categories as DbCategory[]) ?? []}
                allTags={(allTags as DbTag[]) ?? []}
                action={createProduct}
            />
        </div>
    );
}
