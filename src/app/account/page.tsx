import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { createClient } from '@/lib/supabase/server';
import type { DbOrder } from '@/lib/supabase/types';
import AccountSidebar from './AccountSidebar';
import AccountMain from './AccountMain';

export const metadata: Metadata = {
  title: 'My Account | Charm Avenue by Nandini',
  description: 'View and manage your Charm Avenue account.',
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, phone, address')
    .eq('id', user.id)
    .single();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, subtotal, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
      <Header />
      <PageHero
        eyebrow="🤍 My Account"
        title={
          <>
            Hi{profile?.name ? `, ${profile.name}` : ''}
            <span className="font-script" style={{ color: 'var(--blush-rose)' }}>
              {' '}
              !
            </span>
          </>
        }
        subtitle="Manage your name, email and password."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'My Account' }]}
        aside={<AccountSidebar name={profile?.name ?? ''} email={user.email ?? ''} />}
      />
      <section className="w-full px-4 md:px-10 pb-20">
        <div className="max-w-screen-2xl mx-auto">
          <AccountMain
            phone={profile?.phone ?? ''}
            address={profile?.address ?? ''}
            orders={(orders ?? []) as Pick<DbOrder, 'id' | 'status' | 'subtotal' | 'created_at'>[]}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
