import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Icon from '@/components/ui/AppIcon';

export const metadata: Metadata = {
    title: 'About Us | Charm Avenue by Nandini',
    description: 'The story behind Charm Avenue by Nandini — cute, affordable, anti-tarnish jewellery and accessories for every girl.',
};

const values = [
    { icon: '✨', title: 'Anti-Tarnish, Always', text: 'Every jewellery piece is coated to stay shiny wear after wear — no green fingers, no fading.' },
    { icon: '💝', title: 'Budget-Friendly Cute', text: 'Starting at just ₹150, because looking cute shouldn’t need a big budget.' },
    { icon: '🚀', title: 'Fast, Reliable Delivery', text: 'Pan India shipping in 2–5 days, with COD available on every order.' },
    { icon: '🎀', title: 'Made for Every Girl', text: 'From dainty rings to viral bag charms — curated for every vibe and every mood.' },
];

export default function AboutPage() {
    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="🌸 Our Story"
                title={
                    <>
                        Charm you can wear, <span className="font-script" style={{ color: 'var(--blush-rose)' }}>everyday.</span>
                    </>
                }
                subtitle="Charm Avenue by Nandini started with one simple idea: cute, quality accessories shouldn't be hard to find or expensive to own."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
            />

            <section className="w-full px-4 md:px-10 py-14">
                <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-10 items-center mb-16">
                    <div>
                        <span
                            className="badge-pill mb-4 inline-flex"
                            style={{ background: '#FFFFFF', color: 'var(--blush-rose)', border: '1px solid var(--blush-border)' }}
                        >
                            <span>💕</span> Meet Nandini
                        </span>
                        <h2 className="font-elegant-serif text-section-title tracking-tight mb-4" style={{ color: 'var(--blush-text)' }}>
                            Built by someone who loves cute things as much as you do.
                        </h2>
                        <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--blush-text)', opacity: 0.8 }}>
                            Charm Avenue began as a small collection of anti-tarnish jewellery hand-picked for friends and
                            family, and grew into a home for everything cute — hair clips, glossy makeup, bag charms and
                            organiser pouches included.
                        </p>
                        <p className="text-base leading-relaxed" style={{ color: 'var(--blush-text)', opacity: 0.8 }}>
                            Every product is chosen (and often tested first) with one question in mind: would I wear this
                            every single day? If the answer's yes, it makes it into the shop.
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

                {/* Values */}
                <div className="max-w-screen-xl mx-auto mb-16">
                    <h2 className="font-elegant-serif text-section-title tracking-tight mb-8 text-center" style={{ color: 'var(--blush-text)' }}>
                        What we stand for
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {values.map((v) => (
                            <div key={v.title} className="bg-white rounded-3xl p-6 card-bubble">
                                <span className="text-3xl block mb-3">{v.icon}</span>
                                <h3 className="font-bold text-base mb-1.5" style={{ color: 'var(--blush-text)' }}>{v.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--blush-muted)' }}>{v.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="max-w-screen-xl mx-auto text-center">
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
