'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/require-admin';
import { TAG_STYLES, type TagStyleKey, type DbCategory } from '@/lib/supabase/types';

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function revalidateStorefront(slug?: string) {
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
  revalidatePath('/admin/products/new');
  revalidatePath('/');
  revalidatePath('/shop');
  if (slug) revalidatePath(`/shop/${slug}`);
}

async function uploadCategoryImageIfProvided(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  formData: FormData
): Promise<string | null> {
  const file = formData.get('imageFile');
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `categories/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;

  // Every path is unique (timestamped) and never overwritten (upsert: false),
  // so this object's bytes never change — safe to cache for a year rather
  // than the default hour, which was causing Supabase to re-serve the same
  // image on every cache expiry (billed as Cached Egress).
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

interface CategoryFields {
  title: string;
  subtitle: string;
  emoji: string;
  tag: string;
  tag_bg: string;
  tag_text: string;
  description: string;
  sort_order: number;
  image_alt: string;
}

function parseFields(formData: FormData): CategoryFields {
  const title = String(formData.get('title') || '').trim();
  const tagStyle = String(formData.get('tagStyle') || 'rose') as TagStyleKey;
  const style = TAG_STYLES[tagStyle] ?? TAG_STYLES.rose;
  const sortOrder = Number(formData.get('sortOrder'));

  return {
    title,
    subtitle: String(formData.get('subtitle') || '').trim(),
    emoji: String(formData.get('emoji') || '✨').trim() || '✨',
    tag: String(formData.get('tagLabel') || '').trim(),
    tag_bg: style.tagBg ?? TAG_STYLES.rose.tagBg,
    tag_text: style.tagText ?? TAG_STYLES.rose.tagText,
    description: String(formData.get('description') || '').trim(),
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    image_alt: String(formData.get('imageAlt') || '').trim(),
  };
}

export async function createCategory(formData: FormData): Promise<DbCategory> {
  const { supabase } = await requireAdmin();
  const fields = parseFields(formData);
  if (!fields.title) throw new Error('Please enter a category name.');
  if (!fields.tag) throw new Error('Please enter a badge label (e.g. "Best Seller").');

  const imageUrl = await uploadCategoryImageIfProvided(supabase, formData);
  if (!imageUrl) throw new Error('Please add a photo for this category.');
  if (!fields.description) throw new Error('Please add a short description.');

  const baseSlug = slugify(fields.title) || 'category';
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from('categories')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${attempt + 2}`;
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      slug,
      ...fields,
      image: imageUrl,
      image_alt: fields.image_alt || fields.title,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  revalidateStorefront(slug);
  return data as DbCategory;
}

export async function updateCategory(slug: string, formData: FormData): Promise<DbCategory> {
  const { supabase } = await requireAdmin();
  const fields = parseFields(formData);
  if (!fields.title) throw new Error('Please enter a category name.');
  if (!fields.tag) throw new Error('Please enter a badge label (e.g. "Best Seller").');
  if (!fields.description) throw new Error('Please add a short description.');

  const imageUrl = await uploadCategoryImageIfProvided(supabase, formData);

  const update: Record<string, unknown> = {
    ...fields,
    image_alt: fields.image_alt || fields.title,
  };
  if (imageUrl) update.image = imageUrl;

  const { data, error } = await supabase
    .from('categories')
    .update(update)
    .eq('slug', slug)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  revalidateStorefront(slug);
  return data as DbCategory;
}

/**
 * products.category_slug is `on delete restrict` — the admin UI pre-checks usage
 * before offering delete (see CategoryManager), but this catch is a second line
 * of defense against the raw Postgres foreign-key error leaking through if that
 * check is ever stale (e.g. a product was assigned in another tab moments ago).
 */
export async function deleteCategory(slug: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('categories').delete().eq('slug', slug);
  if (error) {
    if (error.code === '23503') {
      throw new Error(
        'This category still has products assigned to it. Reassign them to another category first.'
      );
    }
    throw new Error(error.message);
  }

  revalidateStorefront(slug);
}
