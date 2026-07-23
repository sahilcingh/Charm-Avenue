import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import SignOutButton from './SignOutButton';
import AdminNav from './AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?next=/admin/products');
    }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) {
        redirect('/');
    }

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <header className="border-b bg-white" style={{ borderColor: 'var(--blush-border)' }}>
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6 md:gap-8 min-w-0">
                        <Link href="/admin/products" className="font-script text-2xl shrink-0" style={{ color: 'var(--blush-text)' }}>
                            Charm Avenue <span className="text-sm font-sans font-semibold uppercase tracking-widest align-middle" style={{ color: 'var(--blush-muted)' }}>Admin</span>
                        </Link>
                        <AdminNav />
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full transition-colors duration-150 hover:bg-[var(--blush-bg)]"
                            style={{ color: 'var(--blush-rose)' }}
                        >
                            <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                            View Store
                        </Link>
                        <span className="hidden sm:block w-px h-6" style={{ background: 'var(--blush-border)' }} />
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: 'var(--blush-rose)' }}
                            title={user.email ?? undefined}
                        >
                            {(user.email ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <SignOutButton />
                    </div>
                </div>
            </header>
            <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">{children}</main>
        </div>
    );
}
