'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <button
            onClick={handleSignOut}
            className="text-sm font-bold uppercase tracking-wide px-4 py-2 rounded-full transition-opacity hover:opacity-70"
            style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
        >
            Sign Out
        </button>
    );
}
