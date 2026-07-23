import { createPublicClient } from './public-client';
import { mapCategoryRow, mapProductRow, type Category, type Product } from './product-mapper';
import type { DbCategory, DbProduct, DbProductImage, DbProductVariant } from './types';

type ProductRowWithCategory = DbProduct & { category: Pick<DbCategory, 'title'> | null };

// Explicit FK name required since Phase 3 (product_categories) — PostgREST
// otherwise can't tell whether "categories" means the direct
// products.category_slug FK or the new many-to-many via product_categories.
const PRODUCT_SELECT = '*, category:categories!products_category_slug_fkey(title)';

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

/** Supplementary gallery photos beyond the main product.image — empty for the vast majority of products today. */
export async function getProductImages(productId: string): Promise<DbProductImage[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data as DbProductImage[];
}

/** Color/size options — empty for the vast majority of products today. */
export async function getProductVariants(productId: string): Promise<DbProductVariant[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as DbProductVariant[];
}
