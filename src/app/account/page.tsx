import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { createClient } from '@/lib/supabase/server';
import AccountClient from './AccountClient';

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

    const { data: profile } = await supabase.from('profiles').select('name, email').eq('id', user.id).single();

    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="🤍 My Account"
                title={
                    <>
                        Hi{profile?.name ? `, ${profile.name}` : ''}
                        <span className="font-script" style={{ color: 'var(--blush-rose)' }}> !</span>
                    </>
                }
                subtitle="Manage your name, email and password."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'My Account' }]}
            />
            <section className="w-full px-4 md:px-10 pb-20">
                <div className="max-w-sm mx-auto">
                    <AccountClient name={profile?.name ?? ''} email={user.email ?? ''} />
                </div>
            </section>
            <Footer />
        </main>
    );
}
