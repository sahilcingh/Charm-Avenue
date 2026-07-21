'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TAG_STYLES, type TagStyleKey } from '@/lib/supabase/types';

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
}

function parseForm(formData: FormData): ProductFormValues {
    const price = Number(formData.get('price'));
    const originalPriceRaw = formData.get('originalPrice');
    const originalPrice = originalPriceRaw && String(originalPriceRaw).trim() !== '' ? Number(originalPriceRaw) : null;
    const rating = Number(formData.get('rating') || 4.5);
    const reviewCount = Number(formData.get('reviewCount') || 0);

    return {
        name: String(formData.get('name') || '').trim(),
        categorySlug: String(formData.get('categorySlug') || ''),
        price,
        originalPrice,
        imageAlt: String(formData.get('imageAlt') || '').trim(),
        tagStyle: (String(formData.get('tagStyle') || 'none') as TagStyleKey),
        tagLabel: String(formData.get('tagLabel') || '').trim(),
        emoji: String(formData.get('emoji') || '✨').trim() || '✨',
        description: String(formData.get('description') || '').trim(),
        rating: Number.isFinite(rating) ? rating : 4.5,
        reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
        isActive: formData.get('isActive') === 'on',
    };
}

async function uploadImageIfProvided(formData: FormData): Promise<string | null> {
    const file = formData.get('imageFile');
    if (!(file instanceof File) || file.size === 0) return null;

    const supabase = await createClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;

    const { error } = await supabase.storage.from('product-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);

    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
}

export async function createProduct(formData: FormData) {
    const values = parseForm(formData);
    const supabase = await createClient();

    const imageUrl = await uploadImageIfProvided(formData);
    if (!imageUrl) {
        throw new Error('Please choose a product photo.');
    }

    const tagStyle = TAG_STYLES[values.tagStyle];
    const baseSlug = slugify(values.name) || 'product';
    let slug = baseSlug;
    for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabase.from('products').select('slug').eq('slug', slug).maybeSingle();
        if (!existing) break;
        slug = `${baseSlug}-${attempt + 2}`;
    }

    const { error } = await supabase.from('products').insert({
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
    });

    if (error) throw new Error(error.message);

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    redirect('/admin/products');
}

export async function updateProduct(productId: string, formData: FormData) {
    const values = parseForm(formData);
    const supabase = await createClient();

    const imageUrl = await uploadImageIfProvided(formData);
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
    };
    if (imageUrl) update.image = imageUrl;

    const { error } = await supabase.from('products').update(update).eq('id', productId);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    redirect('/admin/products');
}

export async function deleteProduct(productId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/products');
    revalidatePath('/shop');
}
