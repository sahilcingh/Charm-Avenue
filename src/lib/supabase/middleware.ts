import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { decideAdminAccess } from '@/lib/admin-access';
import { shouldCheckSession } from '@/lib/session-refresh';

/**
 * Gates /admin routes behind Supabase login + the profiles.is_admin flag, and
 * refreshes the Supabase session cookie for any request that actually carries
 * one — a genuinely anonymous visitor (no Supabase cookie, not on /admin)
 * skips Supabase entirely, so the storefront never waits on an auth check it
 * doesn't need. A logged-in customer's session gets refreshed on every route,
 * not just /admin — it previously only refreshed on admin routes, so a
 * customer's session could silently go stale while browsing /account or
 * /wishlist.
 */
export async function updateSession(request: NextRequest) {
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const hasSupabaseCookie = request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'));

    if (!shouldCheckSession({ pathname: request.nextUrl.pathname, hasSupabaseCookie })) {
        return NextResponse.next();
    }

    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                },
            },
        }
    );

    let user = null;
    let isAdmin = false;
    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Supabase auth check timed out')), 5000)
        );
        // Both calls share one timeout — a hang in the profiles lookup must fail closed
        // just as readily as a hang in getUser(), or we reintroduce the old hanging-request bug.
        // The profiles lookup only runs for /admin routes — everywhere else just needs
        // getUser() to run (which refreshes the session cookie via the client above);
        // isAdmin is irrelevant there since decideAdminAccess ignores it for non-admin paths.
        const checkAuth = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user && isAdminRoute) {
                const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single();
                return { user: data.user, isAdmin: profile?.is_admin ?? false };
            }
            return { user: data.user, isAdmin: false };
        };
        const result = await Promise.race([checkAuth(), timeout]);
        user = result.user;
        isAdmin = result.isAdmin;
    } catch {
        // Supabase unreachable, misconfigured, or slow to respond — fail closed on admin
        // routes (treat as logged out) rather than hanging the request or throwing a 500.
    }

    const decision = decideAdminAccess({
        pathname: request.nextUrl.pathname + request.nextUrl.search,
        isLoggedIn: !!user,
        isAdmin,
    });

    if (decision.action === 'redirect') {
        // decision.redirectTo can carry its own query string (e.g. "/login?next=...") —
        // parse it against the request origin rather than mutating .pathname, which
        // would otherwise percent-encode the "?" as a literal path character.
        return NextResponse.redirect(new URL(decision.redirectTo, request.url));
    }

    return response;
}
