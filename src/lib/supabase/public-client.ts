import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Plain, cookie-free Supabase client for public storefront reads (categories,
 * active products). All of this data is readable by anyone under RLS
 * regardless of session, so there's no need for the cookie-aware SSR client
 * here — which matters because this also has to work inside
 * generateStaticParams/generateMetadata, where next/headers' cookies() isn't
 * available (there's no request yet at build time).
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
