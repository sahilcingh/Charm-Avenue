'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/require-admin';

interface ComboFormValues {
  name: string;
  description: string | null;
  discountPercent: number;
  productIds: string[];
}

function parseForm(formData: FormData): ComboFormValues {
  return {
    name: String(formData.get('name') || '').trim(),
    description: String(formData.get('description') || '').trim() || null,
    discountPercent: Number(formData.get('discountPercent')),
    productIds: formData.getAll('productIds').map(String),
  };
}

function validate(values: ComboFormValues) {
  if (!values.name) throw new Error('Please enter a combo name.');
  if (
    !Number.isFinite(values.discountPercent) ||
    values.discountPercent <= 0 ||
    values.discountPercent > 100
  ) {
    throw new Error('Discount percent must be between 1 and 100.');
  }
  if (values.productIds.length < 2) {
    throw new Error('Select at least 2 products for a combo.');
  }
}

export async function createCombo(formData: FormData) {
  const { supabase } = await requireAdmin();
  const values = parseForm(formData);
  validate(values);

  const { data: inserted, error } = await supabase
    .from('combos')
    .insert({
      name: values.name,
      description: values.description,
      discount_percent: values.discountPercent,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  const { error: linkError } = await supabase
    .from('combo_products')
    .insert(
      values.productIds.map((productId) => ({ combo_id: inserted.id, product_id: productId }))
    );
  if (linkError) throw new Error(linkError.message);

  revalidatePath('/admin/combos');
}

/** Replaces the combo's product list wholesale rather than diffing — simpler, and this only ever runs from a full form submission that already lists every product that should remain linked. */
export async function updateCombo(comboId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const values = parseForm(formData);
  validate(values);

  const { error } = await supabase
    .from('combos')
    .update({
      name: values.name,
      description: values.description,
      discount_percent: values.discountPercent,
    })
    .eq('id', comboId);
  if (error) throw new Error(error.message);

  const { error: deleteError } = await supabase
    .from('combo_products')
    .delete()
    .eq('combo_id', comboId);
  if (deleteError) throw new Error(deleteError.message);

  const { error: linkError } = await supabase
    .from('combo_products')
    .insert(values.productIds.map((productId) => ({ combo_id: comboId, product_id: productId })));
  if (linkError) throw new Error(linkError.message);

  revalidatePath('/admin/combos');
}

export async function toggleComboActive(comboId: string, isActive: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('combos').update({ is_active: isActive }).eq('id', comboId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/combos');
}

export async function deleteCombo(comboId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('combos').delete().eq('id', comboId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/combos');
}
