export interface ShouldCheckSessionInput {
    pathname: string;
    hasSupabaseCookie: boolean;
}

/**
 * Whether middleware should bother touching Supabase for this request.
 *
 * Admin routes always need a real check (to decide access). Everywhere else,
 * only bother if a Supabase session cookie is actually present — a genuinely
 * anonymous visitor has nothing to refresh, and the storefront must never
 * wait on an auth call it doesn't need. But a LOGGED-IN customer's cookie
 * being present means their session does need refreshing on every request,
 * not just admin ones — that's the gap this closes: before, only `/admin/*`
 * ever refreshed the session, so a customer's cookie could go stale while
 * browsing `/account` or `/wishlist`.
 */
export function shouldCheckSession({ pathname, hasSupabaseCookie }: ShouldCheckSessionInput): boolean {
    if (pathname.startsWith('/admin')) {
        return true;
    }
    return hasSupabaseCookie;
}
