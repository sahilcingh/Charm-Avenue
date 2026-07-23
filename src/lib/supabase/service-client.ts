import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses RLS entirely. Server-only (the `server-only`
 * import throws a build error if this is ever pulled into client code).
 *
 * Currently used by: the guest order confirmation page
 * (src/app/order/[id]/page.tsx), which has no logged-in session to satisfy
 * the normal RLS policies — access is instead gated by knowing the order's
 * own unguessable UUID, not by auth.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set — from the Supabase Dashboard
 * → Settings → API → service_role key. Never expose this key client-side.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
