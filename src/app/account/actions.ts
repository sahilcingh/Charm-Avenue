'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isValidIndianMobile } from '@/lib/checkout-validation';

export async function updateName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: 'Please enter your name.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You need to be signed in.' };
  }

  const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', user.id);
  if (error) {
    return { error: 'Could not save your name. Please try again.' };
  }

  // Keep auth user_metadata.name in sync too — the Header reads it directly
  // (cheaper than a profiles lookup on every page) to show the account initial.
  await supabase.auth.updateUser({ data: { name: trimmed } });

  revalidatePath('/account');
  return { error: null };
}

/**
 * Saves phone/address so a future checkout can pre-fill them — both are
 * optional here (unlike checkout itself, where they're required), so a
 * customer can fill these in whenever they like rather than being forced to.
 */
export async function updateContactInfo(phone: string, address: string) {
  const trimmedPhone = phone.trim();
  const trimmedAddress = address.trim();

  if (trimmedPhone && !isValidIndianMobile(trimmedPhone)) {
    return { error: 'Please enter a valid 10-digit mobile number.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'You need to be signed in.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ phone: trimmedPhone || null, address: trimmedAddress || null })
    .eq('id', user.id);
  if (error) {
    return { error: 'Could not save your details. Please try again.' };
  }

  revalidatePath('/account');
  return { error: null };
}
