'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

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
            aria-label="Sign out"
            title="Sign out"
            className="w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-colors duration-200 hover:bg-[var(--blush-rose-dark)] hover:text-white hover:border-transparent"
            style={{ borderColor: 'var(--blush-border)', color: 'var(--blush-muted)' }}
        >
            <Icon name="ArrowRightOnRectangleIcon" size={16} />
        </button>
    );
}
