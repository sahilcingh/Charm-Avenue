import React from 'react';
import HeroSection from './components/HeroSection';
import TrustBar from './components/TrustBar';
import CategoryBento from './components/CategoryBento';
import BudgetFilter from './components/BudgetFilter';
import InstagramCarousel from './components/InstagramCarousel';
import TrustCTA from './components/TrustCTA';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCategories, getAllActiveProducts } from '@/lib/supabase/products-data';

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getAllActiveProducts()]);
  // Homepage teasers show a curated slice, not the whole catalog — the full list lives on /shop.
  const budgetPicks = products.slice(0, 10);
  const carouselPicks = products.slice(0, 6);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <HeroSection />
      <TrustBar />
      <CategoryBento categories={categories} />
      <BudgetFilter products={budgetPicks} />
      <InstagramCarousel products={carouselPicks} />
      <TrustCTA />
      <Footer />
    </main>
  );
}
