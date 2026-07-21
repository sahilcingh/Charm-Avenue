import { createClient } from '@/lib/supabase/server';
import type { DbCategory } from '@/lib/supabase/types';
import ProductForm from '../ProductForm';
import { createProduct } from '../actions';

export default async function NewProductPage() {
    const supabase = await createClient();
    const { data: categories } = await supabase.from('categories').select('*').order('sort_order');

    return (
        <div>
            <h1 className="font-elegant-serif text-2xl md:text-3xl mb-6" style={{ color: 'var(--blush-text)' }}>
                Add Product
            </h1>
            <ProductForm categories={(categories as DbCategory[]) ?? []} action={createProduct} />
        </div>
    );
}
