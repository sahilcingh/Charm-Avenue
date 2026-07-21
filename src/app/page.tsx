import React from 'react';
import HeroSection from './components/HeroSection';
import TrustBar from './components/TrustBar';
import CategoryBento from './components/CategoryBento';
import BudgetFilter from './components/BudgetFilter';
import InstagramCarousel from './components/InstagramCarousel';
import TrustCTA from './components/TrustCTA';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-background overflow-x-hidden">
            <Header />
            <HeroSection />
            <TrustBar />
            <CategoryBento />
            <BudgetFilter />
            <InstagramCarousel />
            <TrustCTA />
            <Footer />
        </main>
    );
}