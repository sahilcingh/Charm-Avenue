import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Icon from '@/components/ui/AppIcon';

export const metadata: Metadata = {
    title: 'About Us | Charm Avenue by Nandini',
    description: 'Meet Nandini, the founder of Charm Avenue — bringing you trendy, stylish and affordable accessories, jewellery and cute lifestyle products.',
};

const whyChooseUs = [
    { icon: '✨', title: 'Carefully Curated Collections' },
    { icon: '💅', title: 'Trendy Designs' },
    { icon: '✅', title: 'Quality Checks' },
    { icon: '🔒', title: 'Secure Shopping' },
    { icon: '🛍️', title: 'Trendy Finds' },
];

export default function AboutPage() {
    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="🌸 Who Am I"
                title="Hey, I'm Nandini"
                subtitle="The founder of Charm Avenue by Nandini."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
            />

            <section className="w-full px-4 md:px-10 py-14">
                <div className="max-w-screen-2xl mx-auto grid md:grid-cols-2 gap-10 items-center mb-14">
                    <div>
                        <span
                            className="badge-pill mb-4 inline-flex"
                            style={{ background: '#FFFFFF', color: 'var(--blush-rose)', border: '1px solid var(--blush-border)' }}
                        >
                            <span>💕</span> Founder of Charm Avenue
                        </span>
                        <h2 className="font-elegant-serif text-section-title tracking-tight mb-4" style={{ color: 'var(--blush-text)' }}>
                            Little charms, beautiful moments, and a touch of magic —{' '}
                            <span className="font-script" style={{ color: 'var(--blush-rose)' }}>made to make you uniquely you.</span>
                        </h2>
                        <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--blush-text)', opacity: 0.8 }}>
                            I started Charm Avenue with a passion for bringing you trendy, stylish and affordable
                            accessories, jewellery, and cute lifestyle products. Every item is carefully selected with
                            love to ensure quality and style.
                        </p>
                        <p className="text-base leading-relaxed" style={{ color: 'var(--blush-text)', opacity: 0.8 }}>
                            Thank you for supporting my small business and being a part of this journey.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { num: '12K+', label: 'Happy Customers' },
                            { num: '500+', label: 'Products' },
                            { num: '4.9★', label: 'Average Rating' },
                            { num: '2-5', label: 'Days Delivery' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white rounded-3xl p-6 text-center card-bubble">
                                <p className="font-elegant-serif font-bold text-2xl md:text-3xl" style={{ color: 'var(--blush-rose)' }}>{stat.num}</p>
                                <p className="text-xs font-medium mt-1" style={{ color: 'var(--blush-muted)' }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* What We Sell */}
                <div className="max-w-screen-2xl mx-auto text-center mb-14">
                    <span
                        className="badge-pill mb-4 inline-flex"
                        style={{ background: '#FFFFFF', color: 'var(--blush-rose)', border: '1px solid var(--blush-border)' }}
                    >
                        <span>🛍️</span> What We Sell
                    </span>
                    <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--blush-text)', opacity: 0.8 }}>
                        Hair accessories, cute trendy products, makeup, organisers and many more.
                    </p>
                </div>

                {/* Mission pull-quote */}
                <div className="max-w-screen-2xl mx-auto mb-16">
                    <div
                        className="rounded-4xl p-8 md:p-12 text-center"
                        style={{ background: 'linear-gradient(135deg, #B85864 0%, #E8828F 50%, #D1636F 100%)' }}
                    >
                        <span className="badge-pill mb-4 inline-flex" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#FFFFFF' }}>
                            🎯 My Mission
                        </span>
                        <p className="font-script text-2xl md:text-3xl text-white max-w-2xl mx-auto leading-snug">
                            To bring stylish, affordable and high-quality products that add charm to everyday life.
                        </p>
                    </div>
                </div>

                {/* Why Choose Charm Avenue */}
                <div className="max-w-screen-2xl mx-auto mb-16">
                    <h2 className="font-elegant-serif text-section-title tracking-tight mb-8 text-center" style={{ color: 'var(--blush-text)' }}>
                        Why Choose Charm Avenue
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {whyChooseUs.map((v) => (
                            <div key={v.title} className="bg-white rounded-3xl p-6 text-center card-bubble">
                                <span className="text-3xl block mb-3">{v.icon}</span>
                                <h3 className="font-bold text-base" style={{ color: 'var(--blush-text)' }}>{v.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="max-w-screen-2xl mx-auto text-center">
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-base uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02]"
                        style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.4)' }}
                    >
                        <Icon name="ShoppingBagIcon" size={18} />
                        Shop the Collection
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
