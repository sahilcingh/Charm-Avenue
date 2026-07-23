import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import SignupForm from './SignupForm';

export const metadata: Metadata = {
  title: 'Create Account | Charm Avenue by Nandini',
  description: 'Create a Charm Avenue account to check out faster and keep track of your details.',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
      <Header />
      <PageHero
        eyebrow="✨ Join Us"
        title={
          <>
            Create your{' '}
            <span className="font-script" style={{ color: 'var(--blush-rose)' }}>
              account
            </span>
          </>
        }
        subtitle="Sign up to check out faster next time and keep your details in one place."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Create Account' }]}
      />
      <section className="w-full px-4 md:px-10 pb-20">
        <div className="max-w-sm mx-auto">
          <SignupForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
