import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/admin/login');
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--blush-bg)' }}>
            <header className="border-b bg-white" style={{ borderColor: 'var(--blush-border)' }}>
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <Link href="/admin/products" className="font-script text-2xl" style={{ color: 'var(--blush-text)' }}>
                        Charm Avenue <span className="text-sm font-sans font-semibold uppercase tracking-widest align-middle" style={{ color: 'var(--blush-muted)' }}>Admin</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm hidden sm:block" style={{ color: 'var(--blush-muted)' }}>{user.email}</span>
                        <SignOutButton />
                    </div>
                </div>
            </header>
            <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">{children}</main>
        </div>
    );
}
