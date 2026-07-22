import { createPublicClient } from './public-client';
import { mapCategoryRow, mapProductRow, type Category, type Product } from './product-mapper';
import type { DbCategory, DbProduct } from './types';

type ProductRowWithCategory = DbProduct & { category: Pick<DbCategory, 'title'> | null };

const PRODUCT_SELECT = '*, category:categories(title)';

function mapJoinedProductRow(row: ProductRowWithCategory): Product {
    return mapProductRow(row, row.category?.title);
}

export async function getCategories(): Promise<Category[]> {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error || !data) return [];
    return data.map(mapCategoryRow);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const supabase = createPublicClient();
    const { data } = await supabase.from('categories').select('*').eq('slug', slug).single();
    return data ? mapCategoryRow(data) : undefined;
}

export async function getAllActiveProducts(): Promise<Product[]> {
    const supabase = createPublicClient();
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as unknown as ProductRowWithCategory[]).map(mapJoinedProductRow);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
    const supabase = createPublicClient();
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('is_active', true)
        .eq('category_slug', categorySlug)
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as unknown as ProductRowWithCategory[]).map(mapJoinedProductRow);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
    const supabase = createPublicClient();
    const { data } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('is_active', true)
        .eq('slug', slug)
        .single();
    return data ? mapJoinedProductRow(data as unknown as ProductRowWithCategory) : undefined;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
    const supabase = createPublicClient();
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('is_active', true)
        .eq('category_slug', product.categorySlug)
        .neq('id', product.id)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error || !data) return [];
    return (data as unknown as ProductRowWithCategory[]).map(mapJoinedProductRow);
}
