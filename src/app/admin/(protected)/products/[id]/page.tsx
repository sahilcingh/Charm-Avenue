import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { DbCategory, DbProduct, DbProductImage, DbProductVariant, DbTag } from '@/lib/supabase/types';
import ProductForm from '../ProductForm';
import { updateProduct } from '../actions';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const [{ data: product }, { data: categories }, { data: images }, { data: allTags }, { data: productCategories }, { data: productTags }, { data: variants }] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).maybeSingle(),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('product_images').select('*').eq('product_id', id).order('sort_order', { ascending: true }),
        supabase.from('tags').select('*').order('label', { ascending: true }),
        supabase.from('product_categories').select('category_slug').eq('product_id', id),
        supabase.from('product_tags').select('tag_slug').eq('product_id', id),
        supabase.from('product_variants').select('*').eq('product_id', id).order('created_at', { ascending: true }),
    ]);

    if (!product) notFound();

    const updateProductWithId = updateProduct.bind(null, id);
    const selectedCategorySlugs = (productCategories ?? [])
        .map((row: { category_slug: string }) => row.category_slug)
        .filter((slug: string) => slug !== product.category_slug);
    const selectedTagSlugs = (productTags ?? []).map((row: { tag_slug: string }) => row.tag_slug);

    return (
        <div>
            <h1 className="font-elegant-serif text-2xl md:text-3xl mb-6" style={{ color: 'var(--blush-text)' }}>
                Edit Product
            </h1>
            <ProductForm
                categories={(categories as DbCategory[]) ?? []}
                product={product as DbProduct}
                images={(images as DbProductImage[]) ?? []}
                allTags={(allTags as DbTag[]) ?? []}
                selectedCategorySlugs={selectedCategorySlugs}
                selectedTagSlugs={selectedTagSlugs}
                variants={(variants as DbProductVariant[]) ?? []}
                action={updateProductWithId}
            />
        </div>
    );
}
