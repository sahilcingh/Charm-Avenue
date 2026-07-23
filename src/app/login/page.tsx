import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { createClient } from '@/lib/supabase/server';
import { resolveLoginRedirect } from '@/lib/auth-validation';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
    title: 'Sign In | Charm Avenue by Nandini',
    description: 'Sign in to your Charm Avenue account.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        const { next } = await searchParams;
        redirect(resolveLoginRedirect({ isAdmin: profile?.is_admin ?? false, next: next ?? null }));
    }

    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="👋 Welcome Back"
                title={
                    <>
                        Sign in to your <span className="font-script" style={{ color: 'var(--blush-rose)' }}>account</span>
                    </>
                }
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Sign In' }]}
            />
            <section className="w-full px-4 md:px-10 pb-20">
                <div className="max-w-sm mx-auto">
                    <Suspense fallback={null}>
                        <LoginForm />
                    </Suspense>
                </div>
            </section>
            <Footer />
        </main>
    );
}
