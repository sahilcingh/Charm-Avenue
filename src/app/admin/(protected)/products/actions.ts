'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/require-admin';
import { compressProductImage } from '@/lib/product-image-compression';
import { TAG_STYLES, type TagStyleKey, type ProductStockStatus } from '@/lib/supabase/types';

const VALID_STOCK_STATUSES: ProductStockStatus[] = [
  'in_stock',
  'out_of_stock',
  'made_to_order',
  'discontinued',
];
const PERSONALIZATION_MAX_LENGTH_FALLBACK = 50;

function validateProductValues(values: Pick<ProductFormValues, 'price' | 'originalPrice'>) {
  if (!Number.isFinite(values.price) || values.price < 0) {
    throw new Error('Please enter a valid, non-negative price.');
  }
  if (
    values.originalPrice !== null &&
    (!Number.isFinite(values.originalPrice) || values.originalPrice < 0)
  ) {
    throw new Error('Please enter a valid, non-negative original price.');
  }
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ProductFormValues {
  name: string;
  categorySlug: string;
  price: number;
  originalPrice: number | null;
  imageAlt: string;
  tagStyle: TagStyleKey;
  tagLabel: string;
  emoji: string;
  description: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  // Phase 1 — each stays null/false unless its section's own enabling
  // toggle is on, regardless of any stray values elsewhere in the form data.
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  dimensions: string | null;
  material: string | null;
  careInstructions: string | null;
  stockStatus: ProductStockStatus | null;
  madeToOrderLeadTime: string | null;
  lowStockThreshold: number | null;
  stockCount: number | null;
  personalizationEnabled: boolean;
  personalizationLabel: string | null;
  personalizationRequired: boolean;
  personalizationMaxLength: number | null;
  // Phase 3 — categories beyond the required primary one, plus tags.
  extraCategorySlugs: string[];
  tagSlugs: string[];
  // Phase 8 — explicit New Arrivals/Best Sellers membership.
  isNewArrival: boolean;
  isBestSeller: boolean;
}

function parseForm(formData: FormData): ProductFormValues {
  const price = Number(formData.get('price'));
  const originalPriceRaw = formData.get('originalPrice');
  const originalPrice =
    originalPriceRaw && String(originalPriceRaw).trim() !== '' ? Number(originalPriceRaw) : null;
  const rating = Number(formData.get('rating') || 4.5);
  const reviewCount = Number(formData.get('reviewCount') || 0);

  const trackStock = formData.get('trackStock') === 'on';
  const stockStatusRaw = String(formData.get('stockStatus') || '');
  const stockStatus =
    trackStock && VALID_STOCK_STATUSES.includes(stockStatusRaw as ProductStockStatus)
      ? (stockStatusRaw as ProductStockStatus)
      : null;
  const madeToOrderLeadTime =
    trackStock && stockStatus === 'made_to_order'
      ? String(formData.get('madeToOrderLeadTime') || '').trim() || null
      : null;
  const lowStockThresholdRaw = trackStock
    ? String(formData.get('lowStockThreshold') || '').trim()
    : '';
  const lowStockThreshold = lowStockThresholdRaw !== '' ? Number(lowStockThresholdRaw) : null;
  const stockCountRaw = trackStock ? String(formData.get('stockCount') || '').trim() : '';
  const stockCount = stockCountRaw !== '' ? Number(stockCountRaw) : null;

  const scheduleSale = formData.get('scheduleSale') === 'on';
  const saleStartsAtRaw = scheduleSale ? String(formData.get('saleStartsAt') || '').trim() : '';
  const saleEndsAtRaw = scheduleSale ? String(formData.get('saleEndsAt') || '').trim() : '';

  const personalizationEnabled = formData.get('personalizationEnabled') === 'on';
  const personalizationMaxLengthRaw = personalizationEnabled
    ? String(formData.get('personalizationMaxLength') || '').trim()
    : '';

  return {
    name: String(formData.get('name') || '').trim(),
    categorySlug: String(formData.get('categorySlug') || ''),
    price,
    originalPrice,
    imageAlt: String(formData.get('imageAlt') || '').trim(),
    tagStyle: String(formData.get('tagStyle') || 'none') as TagStyleKey,
    tagLabel: String(formData.get('tagLabel') || '').trim(),
    emoji: String(formData.get('emoji') || '✨').trim() || '✨',
    description: String(formData.get('description') || '').trim(),
    rating: Number.isFinite(rating) ? rating : 4.5,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    isActive: formData.get('isActive') === 'on',
    saleStartsAt: saleStartsAtRaw ? `${saleStartsAtRaw}T00:00:00.000Z` : null,
    saleEndsAt: saleEndsAtRaw ? `${saleEndsAtRaw}T23:59:59.999Z` : null,
    dimensions: String(formData.get('dimensions') || '').trim() || null,
    material: String(formData.get('material') || '').trim() || null,
    careInstructions: String(formData.get('careInstructions') || '').trim() || null,
    stockStatus,
    madeToOrderLeadTime,
    lowStockThreshold: Number.isFinite(lowStockThreshold) ? lowStockThreshold : null,
    stockCount: Number.isFinite(stockCount) ? stockCount : null,
    personalizationEnabled,
    personalizationLabel: personalizationEnabled
      ? String(formData.get('personalizationLabel') || '').trim() || null
      : null,
    personalizationRequired:
      personalizationEnabled && formData.get('personalizationRequired') === 'on',
    personalizationMaxLength: !personalizationEnabled
      ? null
      : personalizationMaxLengthRaw !== ''
        ? Number(personalizationMaxLengthRaw)
        : PERSONALIZATION_MAX_LENGTH_FALLBACK,
    extraCategorySlugs: formData.getAll('extraCategories').map(String),
    tagSlugs: formData.getAll('tags').map(String),
    isNewArrival: formData.get('isNewArrival') === 'on',
    isBestSeller: formData.get('isBestSeller') === 'on',
  };
}

type AdminSupabaseClient = Awaited<ReturnType<typeof requireAdmin>>['supabase'];

/** Best-effort — a logging failure should never block a legitimate admin action from completing. */
async function logAdminAction(
  supabase: AdminSupabaseClient,
  adminId: string,
  action: 'create' | 'update' | 'delete',
  productId: string | null,
  productName: string
) {
  const { error } = await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    product_id: productId,
    product_name: productName,
  });
  if (error) {
    console.error('Failed to write admin audit log entry:', error.message);
  }
}

async function uploadImageIfProvided(
  supabase: AdminSupabaseClient,
  formData: FormData
): Promise<string | null> {
  const file = formData.get('imageFile');
  if (!(file instanceof File) || file.size === 0) return null;

  const { body, contentType, ext } = await compressProductImage(file);
  const path = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;

  // Every path is unique (timestamped) and never overwritten (upsert: false),
  // so this object's bytes never change — safe to cache for a year rather
  // than the default hour, which was causing Supabase to re-serve the same
  // image on every cache expiry (billed as Cached Egress).
  const { error } = await supabase.storage.from('product-images').upload(path, body, {
    cacheControl: '31536000',
    upsert: false,
    contentType,
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Full resync, not an incremental diff — simplest to reason about, and safe
 * since every statement is scoped to this one product_id. The primary
 * category is always included alongside any extra ones, since
 * product_categories was backfilled to be a complete membership list (not
 * just "the extras") — future category-listing code can read this table
 * alone without also checking products.category_slug separately.
 */
async function syncProductCategoriesAndTags(
  supabase: AdminSupabaseClient,
  productId: string,
  primaryCategorySlug: string,
  extraCategorySlugs: string[],
  tagSlugs: string[]
) {
  const allCategorySlugs = Array.from(new Set([primaryCategorySlug, ...extraCategorySlugs]));

  const { error: categoriesDeleteError } = await supabase
    .from('product_categories')
    .delete()
    .eq('product_id', productId);
  if (categoriesDeleteError) {
    console.error('Failed to resync product_categories:', categoriesDeleteError.message);
    return;
  }
  if (allCategorySlugs.length > 0) {
    const { error: categoriesInsertError } = await supabase
      .from('product_categories')
      .insert(allCategorySlugs.map((category_slug) => ({ product_id: productId, category_slug })));
    if (categoriesInsertError)
      console.error('Failed to insert product_categories:', categoriesInsertError.message);
  }

  const { error: tagsDeleteError } = await supabase
    .from('product_tags')
    .delete()
    .eq('product_id', productId);
  if (tagsDeleteError) {
    console.error('Failed to resync product_tags:', tagsDeleteError.message);
    return;
  }
  if (tagSlugs.length > 0) {
    const { error: tagsInsertError } = await supabase
      .from('product_tags')
      .insert(tagSlugs.map((tag_slug) => ({ product_id: productId, tag_slug })));
    if (tagsInsertError) console.error('Failed to insert product_tags:', tagsInsertError.message);
  }
}

export async function createProduct(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const values = parseForm(formData);
  validateProductValues(values);

  const imageUrl = await uploadImageIfProvided(supabase, formData);
  if (!imageUrl) {
    throw new Error('Please choose a product photo.');
  }

  const tagStyle = TAG_STYLES[values.tagStyle];
  const baseSlug = slugify(values.name) || 'product';
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from('products')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${attempt + 2}`;
  }

  const { data: inserted, error } = await supabase
    .from('products')
    .insert({
      slug,
      name: values.name,
      category_slug: values.categorySlug,
      price: values.price,
      original_price: values.originalPrice,
      image: imageUrl,
      image_alt: values.imageAlt || values.name,
      tag: values.tagStyle === 'none' ? null : values.tagLabel || null,
      tag_bg: tagStyle.tagBg,
      tag_text: tagStyle.tagText,
      emoji: values.emoji,
      description: values.description,
      rating: values.rating,
      review_count: values.reviewCount,
      is_active: values.isActive,
      sale_starts_at: values.saleStartsAt,
      sale_ends_at: values.saleEndsAt,
      dimensions: values.dimensions,
      material: values.material,
      care_instructions: values.careInstructions,
      stock_status: values.stockStatus,
      made_to_order_lead_time: values.madeToOrderLeadTime,
      low_stock_threshold: values.lowStockThreshold,
      stock_count: values.stockCount,
      personalization_enabled: values.personalizationEnabled,
      personalization_label: values.personalizationLabel,
      personalization_required: values.personalizationRequired,
      personalization_max_length: values.personalizationMaxLength,
      is_new_arrival: values.isNewArrival,
      is_best_seller: values.isBestSeller,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  if (inserted?.id) {
    await syncProductCategoriesAndTags(
      supabase,
      inserted.id,
      values.categorySlug,
      values.extraCategorySlugs,
      values.tagSlugs
    );
  }
  await logAdminAction(supabase, user.id, 'create', inserted?.id ?? null, values.name);

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  redirect('/admin/products');
}

export async function updateProduct(productId: string, formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const values = parseForm(formData);
  validateProductValues(values);

  const imageUrl = await uploadImageIfProvided(supabase, formData);
  const tagStyle = TAG_STYLES[values.tagStyle];

  const update: Record<string, unknown> = {
    name: values.name,
    category_slug: values.categorySlug,
    price: values.price,
    original_price: values.originalPrice,
    image_alt: values.imageAlt || values.name,
    tag: values.tagStyle === 'none' ? null : values.tagLabel || null,
    tag_bg: tagStyle.tagBg,
    tag_text: tagStyle.tagText,
    emoji: values.emoji,
    description: values.description,
    rating: values.rating,
    review_count: values.reviewCount,
    is_active: values.isActive,
    sale_starts_at: values.saleStartsAt,
    sale_ends_at: values.saleEndsAt,
    dimensions: values.dimensions,
    material: values.material,
    care_instructions: values.careInstructions,
    stock_status: values.stockStatus,
    made_to_order_lead_time: values.madeToOrderLeadTime,
    low_stock_threshold: values.lowStockThreshold,
    stock_count: values.stockCount,
    personalization_enabled: values.personalizationEnabled,
    personalization_label: values.personalizationLabel,
    personalization_required: values.personalizationRequired,
    personalization_max_length: values.personalizationMaxLength,
    is_new_arrival: values.isNewArrival,
    is_best_seller: values.isBestSeller,
  };
  if (imageUrl) update.image = imageUrl;

  const { error } = await supabase.from('products').update(update).eq('id', productId);
  if (error) throw new Error(error.message);

  await syncProductCategoriesAndTags(
    supabase,
    productId,
    values.categorySlug,
    values.extraCategorySlugs,
    values.tagSlugs
  );
  await logAdminAction(supabase, user.id, 'update', productId, values.name);

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  redirect('/admin/products');
}

/**
 * combo_products.product_id and homepage_section_products.product_id are both
 * `on delete cascade`, so deleting a product would otherwise silently strip it
 * out of any combo or homepage section with zero warning — unlike deleting a
 * category, which the DB itself blocks (`on delete restrict`). This check is
 * the only thing standing between a delete and that silent breakage.
 */
export async function deleteProduct(productId: string, productName: string) {
  const { supabase, user } = await requireAdmin();

  const [{ count: comboCount }, { count: sectionCount }] = await Promise.all([
    supabase
      .from('combo_products')
      .select('product_id', { count: 'exact', head: true })
      .eq('product_id', productId),
    supabase
      .from('homepage_section_products')
      .select('product_id', { count: 'exact', head: true })
      .eq('product_id', productId),
  ]);
  const usages: string[] = [];
  if (comboCount) usages.push(`${comboCount} combo${comboCount === 1 ? '' : 's'}`);
  if (sectionCount) usages.push(`${sectionCount} homepage section${sectionCount === 1 ? '' : 's'}`);
  if (usages.length > 0) {
    throw new Error(`This product is used in ${usages.join(' and ')}. Remove it from those first.`);
  }

  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw new Error(error.message);

  await logAdminAction(supabase, user.id, 'delete', productId, productName);

  revalidatePath('/admin/products');
  revalidatePath('/shop');
}

/**
 * Additional (non-cover) gallery photos — products.image stays the
 * permanent cover shown everywhere else. sort_order uses the upload
 * timestamp rather than a computed max+1, so adding a photo never needs an
 * extra read first; reorderProductImage below is how the admin fine-tunes
 * the order afterwards.
 */
export async function addProductImage(productId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const imageUrl = await uploadImageIfProvided(supabase, formData);
  if (!imageUrl) {
    throw new Error('Please choose a photo.');
  }

  const { error } = await supabase.from('product_images').insert({
    product_id: productId,
    url: imageUrl,
    alt: String(formData.get('alt') || '').trim(),
    sort_order: Date.now(),
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath('/shop');
}

export async function removeProductImage(imageId: string, productId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath('/shop');
}

/** Swaps sort_order with the adjacent image — a no-op at either end of the list. */
export async function reorderProductImage(
  imageId: string,
  productId: string,
  direction: 'up' | 'down'
) {
  const { supabase } = await requireAdmin();

  const { data: images } = await supabase
    .from('product_images')
    .select('id, sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  const list = (images ?? []) as { id: string; sort_order: number }[];
  const index = list.findIndex((img) => img.id === imageId);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return;

  const current = list[index];
  const swapWith = list[swapIndex];

  const [{ error: currentError }, { error: swapError }] = await Promise.all([
    supabase
      .from('product_images')
      .update({ sort_order: swapWith.sort_order })
      .eq('id', current.id),
    supabase
      .from('product_images')
      .update({ sort_order: current.sort_order })
      .eq('id', swapWith.id),
  ]);
  if (currentError || swapError) {
    throw new Error(currentError?.message ?? swapError?.message ?? 'Failed to reorder photo.');
  }

  revalidatePath(`/admin/products/${productId}`);
}

/** A new variant starts entirely blank — the admin fills it in via updateVariant right after. */
export async function addVariant(productId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('product_variants').insert({ product_id: productId });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
}

export async function updateVariant(variantId: string, productId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const imageUrl = await uploadImageIfProvided(supabase, formData);
  const color = String(formData.get('color') || '').trim() || null;

  // A color variant is only useful as a storefront swatch if shoppers can actually see what
  // that color looks like — require a photo (new upload or one already on the row) once a
  // color is set, rather than silently falling back to the base product's own photo.
  if (color) {
    let hasImage = Boolean(imageUrl);
    if (!hasImage) {
      const { data: existing } = await supabase
        .from('product_variants')
        .select('image')
        .eq('id', variantId)
        .single();
      hasImage = Boolean(existing?.image);
    }
    if (!hasImage) {
      throw new Error("Please add a photo for this color. It's shown when shoppers select it.");
    }
  }

  const priceOverrideRaw = String(formData.get('priceOverride') || '').trim();
  const originalPriceOverrideRaw = String(formData.get('originalPriceOverride') || '').trim();
  const stockStatusRaw = String(formData.get('stockStatus') || '');
  const stockCountRaw = String(formData.get('stockCount') || '').trim();

  const priceOverride = priceOverrideRaw !== '' ? Number(priceOverrideRaw) : null;
  const originalPriceOverride =
    originalPriceOverrideRaw !== '' ? Number(originalPriceOverrideRaw) : null;
  const stockCount = stockCountRaw !== '' ? Number(stockCountRaw) : null;
  if (priceOverride !== null && (!Number.isFinite(priceOverride) || priceOverride < 0)) {
    throw new Error('Please enter a valid, non-negative price override.');
  }
  if (
    originalPriceOverride !== null &&
    (!Number.isFinite(originalPriceOverride) || originalPriceOverride < 0)
  ) {
    throw new Error('Please enter a valid, non-negative original price override.');
  }
  if (stockCount !== null && (!Number.isFinite(stockCount) || stockCount < 0)) {
    throw new Error('Please enter a valid, non-negative stock count.');
  }

  const update: Record<string, unknown> = {
    color,
    size: String(formData.get('size') || '').trim() || null,
    sku: String(formData.get('sku') || '').trim() || null,
    price_override: priceOverride,
    original_price_override: originalPriceOverride,
    stock_status: VALID_STOCK_STATUSES.includes(stockStatusRaw as ProductStockStatus)
      ? stockStatusRaw
      : null,
    stock_count: stockCount,
    is_active: formData.get('isActive') !== 'off',
  };
  if (imageUrl) update.image = imageUrl;

  const { error } = await supabase.from('product_variants').update(update).eq('id', variantId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath('/shop');
}

/** Quick inline toggle from the products list — same column ProductForm's Stock & Availability section writes to. */
export async function updateProductStockStatus(productId: string, status: ProductStockStatus) {
  const { supabase } = await requireAdmin();
  if (!VALID_STOCK_STATUSES.includes(status)) {
    throw new Error('Invalid stock status.');
  }

  const { error } = await supabase
    .from('products')
    .update({ stock_status: status })
    .eq('id', productId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/products');
  revalidatePath('/shop');
}

export async function removeVariant(variantId: string, productId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath('/shop');
}
