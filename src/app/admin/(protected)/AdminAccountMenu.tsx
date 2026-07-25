'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

/** Mobile's single account entry point — replaces the avatar + bare sign-out
 * icon sitting disconnected in the header with one tap target that opens
 * both "View Store" and "Sign Out" together. */
export default function AdminAccountMenu({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: 'var(--blush-rose-button)' }}
        title={email ?? undefined}
      >
        {(email ?? '?').charAt(0).toUpperCase()}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 w-44 rounded-2xl border bg-white p-1 shadow-lg z-50"
          style={{ borderColor: 'var(--blush-border)' }}
        >
          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 hover:bg-[var(--blush-bg)]"
            style={{ color: 'var(--blush-rose)' }}
          >
            <Icon name="ArrowTopRightOnSquareIcon" size={15} />
            View Store
          </Link>
          <div className="h-px my-1 mx-2" style={{ background: 'var(--blush-border)' }} />
          <button
            role="menuitem"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors duration-150 hover:bg-[var(--blush-bg)]"
            style={{ color: 'var(--blush-muted)' }}
          >
            <Icon name="ArrowRightOnRectangleIcon" size={15} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
