import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Gates /admin routes behind Supabase login. Every other route skips Supabase
 * entirely — the storefront must never wait on (or break because of) an admin
 * auth check it doesn't need.
 */
export async function updateSession(request: NextRequest) {
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    if (!isAdminRoute) {
        return NextResponse.next();
    }

    const isLoginRoute = request.nextUrl.pathname === '/admin/login';
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
    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Supabase auth check timed out')), 5000)
        );
        const result = await Promise.race([supabase.auth.getUser(), timeout]);
        user = result.data.user;
    } catch {
        // Supabase unreachable, misconfigured, or slow to respond — fail closed on admin
        // routes (treat as logged out) rather than hanging the request or throwing a 500.
    }

    if (!isLoginRoute && !user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/admin/login';
        return NextResponse.redirect(loginUrl);
    }

    if (isLoginRoute && user) {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = '/admin/products';
        return NextResponse.redirect(adminUrl);
    }

    return response;
}
