'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/require-admin';

function slugify(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function createTag(formData: FormData) {
    const { supabase } = await requireAdmin();
    const label = String(formData.get('label') || '').trim();
    if (!label) throw new Error('Please enter a tag name.');

    const baseSlug = slugify(label) || 'tag';
    let slug = baseSlug;
    for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabase.from('tags').select('slug').eq('slug', slug).maybeSingle();
        if (!existing) break;
        slug = `${baseSlug}-${attempt + 2}`;
    }

    const { error } = await supabase.from('tags').insert({ slug, label });
    if (error) throw new Error(error.message);

    revalidatePath('/admin/tags');
}

/** The slug is fixed at creation (mirrors how a product's slug never changes on edit) — only the display label can be renamed. */
export async function updateTagLabel(slug: string, label: string) {
    const { supabase } = await requireAdmin();
    const trimmed = label.trim();
    if (!trimmed) throw new Error('Tag name cannot be empty.');

    const { error } = await supabase.from('tags').update({ label: trimmed }).eq('slug', slug);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/tags');
    revalidatePath('/shop');
}

export async function deleteTag(slug: string) {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('tags').delete().eq('slug', slug);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/tags');
    revalidatePath('/shop');
}
