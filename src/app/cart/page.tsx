import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import CartClient from './CartClient';

export const metadata: Metadata = {
  title: 'Your Bag | Charm Avenue by Nandini',
  description: 'Review the items in your Charm Avenue shopping bag.',
};

export default function CartPage() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
      <Header />
      <PageHero
        eyebrow="🛍️ Your Bag"
        title="Your Shopping Bag"
        subtitle="Review your picks, update quantities, and keep browsing whenever you're ready."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Cart' }]}
      />
      <CartClient />
      <Footer />
    </main>
  );
}
