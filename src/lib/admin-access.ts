export interface AdminAccessInput {
    pathname: string;
    isLoggedIn: boolean;
    isAdmin: boolean;
}

export type AdminAccessDecision = { action: 'next' } | { action: 'redirect'; redirectTo: string };

/**
 * Pure decision logic for /admin route gating, kept separate from
 * NextRequest/NextResponse so it can be unit tested directly.
 *
 * There is a single unified login page (/login) for both customers and the
 * admin — it decides where to send someone post-login based on their role
 * (see resolveLoginRedirect). So a logged-out visit to any /admin/* route
 * just bounces to /login, remembering where they were headed via `next`.
 *
 * A logged-in customer (isLoggedIn && !isAdmin) must never reach a protected
 * admin route — that's the gap that opened up once customers could sign up
 * too, since the old check only asked "is anyone logged in".
 */
export function decideAdminAccess({ pathname, isLoggedIn, isAdmin }: AdminAccessInput): AdminAccessDecision {
    if (!pathname.startsWith('/admin')) {
        return { action: 'next' };
    }
    if (!isLoggedIn) {
        return { action: 'redirect', redirectTo: `/login?next=${encodeURIComponent(pathname)}` };
    }
    if (!isAdmin) {
        return { action: 'redirect', redirectTo: '/' };
    }
    return { action: 'next' };
}
