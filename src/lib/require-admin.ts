import { createClient } from '@/lib/supabase/server';

/**
 * Server-side admin gate for Server Actions. Actions that mutate products/categories
 * are also protected by RLS (is_admin() on the products/categories/storage.objects
 * policies), but that was the ONLY layer checking this — a caller invoking the action
 * directly (bypassing the admin UI) had nothing in the action's own code stopping it.
 * This adds that check independently of RLS, so the app doesn't rely on a single layer
 * of defense for admin-only mutations.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in as an admin to do this.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) {
    throw new Error('You must be an admin to do this.');
  }

  return { supabase, user };
}
