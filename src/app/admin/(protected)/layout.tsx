import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import SignOutButton from './SignOutButton';
import AdminNav from './AdminNav';
import AdminBottomNav from './AdminBottomNav';
import AdminAccountMenu from './AdminAccountMenu';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Every /admin/* request already passed through middleware's decideAdminAccess (getUser() +
  // a profiles.is_admin check), which redirects anyone who isn't a logged-in admin before this
  // layout ever runs — repeating that same profile lookup here just added a second full
  // round-trip to every admin page load for no additional protection. Server Actions still do
  // their own independent requireAdmin() check (see src/lib/require-admin.ts), since those can
  // be invoked from routes middleware's /admin path-matcher never sees — that's a different
  // attack surface than "did this page render," which is all this layout is gating.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin/products');
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
      <header className="border-b bg-white" style={{ borderColor: 'var(--blush-border)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 md:gap-8 min-w-0">
            <Link
              href="/admin/products"
              className="font-script text-2xl shrink-0"
              style={{ color: 'var(--blush-text)' }}
            >
              Charm Avenue{' '}
              <span
                className="text-sm font-sans font-semibold uppercase tracking-widest align-middle"
                style={{ color: 'var(--blush-muted)' }}
              >
                Admin
              </span>
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
            <span
              className="hidden sm:block w-px h-6"
              style={{ background: 'var(--blush-border)' }}
            />
            <div
              className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'var(--blush-rose)' }}
              title={user.email ?? undefined}
            >
              {(user.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <SignOutButton />
            </div>
            {/* Mobile: one account button instead of two disconnected ones */}
            <div className="sm:hidden">
              <AdminAccountMenu email={user.email ?? null} />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-8 pb-24 sm:pb-8">{children}</main>
      <AdminBottomNav />
    </div>
  );
}
