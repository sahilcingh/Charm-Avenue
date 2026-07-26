import React from 'react';
import HeroSection from './components/HeroSection';
import TrustBar from './components/TrustBar';
import CategoryBento from './components/CategoryBento';
import HomepageSection from './components/HomepageSection';
import TrustCTA from './components/TrustCTA';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCategories } from '@/lib/supabase/products-data';
import { getHomepageSections } from '@/lib/supabase/homepage-sections-data';

export default async function HomePage() {
  const [categories, sections] = await Promise.all([getCategories(), getHomepageSections()]);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <HeroSection />
      <TrustBar />
      <CategoryBento categories={categories} />
      {sections.map((section) => (
        <HomepageSection key={section.id} {...section} />
      ))}
      <TrustCTA />
      <Footer />
    </main>
  );
}
