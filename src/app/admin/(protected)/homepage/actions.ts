'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/require-admin';
import type { HomepageSectionLayout } from '@/lib/supabase/types';

interface SectionFormValues {
  title: string;
  eyebrowEmoji: string;
  eyebrowLabel: string;
  subtitle: string | null;
  layout: HomepageSectionLayout;
  productIds: string[];
}

function parseForm(formData: FormData): SectionFormValues {
  return {
    title: String(formData.get('title') || '').trim(),
    eyebrowEmoji: String(formData.get('eyebrowEmoji') || '').trim() || '✨',
    eyebrowLabel: String(formData.get('eyebrowLabel') || '').trim() || 'Featured',
    subtitle: String(formData.get('subtitle') || '').trim() || null,
    layout: formData.get('layout') === 'carousel' ? 'carousel' : 'grid',
    productIds: formData.getAll('productIds').map(String),
  };
}

function validate(values: SectionFormValues) {
  if (!values.title) throw new Error('Please enter a section title.');
}

async function resyncSectionProducts(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  sectionId: string,
  productIds: string[]
) {
  const { error: deleteError } = await supabase
    .from('homepage_section_products')
    .delete()
    .eq('section_id', sectionId);
  if (deleteError) throw new Error(deleteError.message);

  if (productIds.length > 0) {
    const { error: insertError } = await supabase.from('homepage_section_products').insert(
      productIds.map((product_id, index) => ({
        section_id: sectionId,
        product_id,
        sort_order: index,
      }))
    );
    if (insertError) throw new Error(insertError.message);
  }
}

export async function createSection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const values = parseForm(formData);
  validate(values);

  const { data: last } = await supabase
    .from('homepage_sections')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (last?.sort_order ?? -1) + 1;

  const { data: inserted, error } = await supabase
    .from('homepage_sections')
    .insert({
      title: values.title,
      eyebrow_emoji: values.eyebrowEmoji,
      eyebrow_label: values.eyebrowLabel,
      subtitle: values.subtitle,
      layout: values.layout,
      sort_order: nextSortOrder,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  if (inserted?.id) {
    await resyncSectionProducts(supabase, inserted.id, values.productIds);
  }

  revalidatePath('/admin/homepage');
  revalidatePath('/');
}

/** Replaces the section's product list wholesale rather than diffing — simpler, and this only ever runs from a full form submission that already lists every product that should remain, in order. */
export async function updateSection(sectionId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const values = parseForm(formData);
  validate(values);

  const { error } = await supabase
    .from('homepage_sections')
    .update({
      title: values.title,
      eyebrow_emoji: values.eyebrowEmoji,
      eyebrow_label: values.eyebrowLabel,
      subtitle: values.subtitle,
      layout: values.layout,
    })
    .eq('id', sectionId);
  if (error) throw new Error(error.message);

  await resyncSectionProducts(supabase, sectionId, values.productIds);

  revalidatePath('/admin/homepage');
  revalidatePath('/');
}

export async function deleteSection(sectionId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('homepage_sections').delete().eq('id', sectionId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/homepage');
  revalidatePath('/');
}

export async function reorderSection(sectionId: string, direction: 'up' | 'down') {
  const { supabase } = await requireAdmin();
  const { data: sections, error } = await supabase
    .from('homepage_sections')
    .select('id, sort_order')
    .order('sort_order', { ascending: true });
  if (error || !sections) return;

  const index = sections.findIndex((s) => s.id === sectionId);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= sections.length) return;

  const current = sections[index];
  const swapWith = sections[swapIndex];

  await supabase
    .from('homepage_sections')
    .update({ sort_order: swapWith.sort_order })
    .eq('id', current.id);
  await supabase
    .from('homepage_sections')
    .update({ sort_order: current.sort_order })
    .eq('id', swapWith.id);

  revalidatePath('/admin/homepage');
  revalidatePath('/');
}
