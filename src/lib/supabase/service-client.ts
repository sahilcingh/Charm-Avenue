import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses RLS entirely. Server-only (the `server-only`
 * import throws a build error if this is ever pulled into client code).
 *
 * Currently used by: the Cashfree payment webhook
 * (src/app/api/webhooks/cashfree/route.ts), which has no logged-in session to
 * satisfy the normal RLS policies and needs to mark any customer's order paid.
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
