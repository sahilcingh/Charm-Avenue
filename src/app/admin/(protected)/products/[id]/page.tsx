import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { DbCategory, DbProduct } from '@/lib/supabase/types';
import ProductForm from '../ProductForm';
import { updateProduct } from '../actions';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const [{ data: product }, { data: categories }] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).maybeSingle(),
        supabase.from('categories').select('*').order('sort_order'),
    ]);

    if (!product) notFound();

    const updateProductWithId = updateProduct.bind(null, id);

    return (
        <div>
            <h1 className="font-elegant-serif text-2xl md:text-3xl mb-6" style={{ color: 'var(--blush-text)' }}>
                Edit Product
            </h1>
            <ProductForm categories={(categories as DbCategory[]) ?? []} product={product as DbProduct} action={updateProductWithId} />
        </div>
    );
}
