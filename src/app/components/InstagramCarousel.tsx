'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/lib/toast-context';

interface FeedItem {
    id: string;
    productId: string;
    image: string;
    imageAlt: string;
    caption: string;
    price: string;
    likes: string;
    tag: string;
    emoji: string;
    tagBg: string;
}

const feedItems: FeedItem[] = [
    {
        id: 'f1',
        productId: 'p8',
        image: 'https://images.unsplash.com/photo-1731406322264-dac59f83828b',
        imageAlt: 'Woman wearing gold layered necklaces and rings, golden hour warm light, soft feminine portrait',
        caption: 'Layered & loving it 💛',
        price: '₹899',
        likes: '4.2k',
        tag: 'Crystal Neck Chain',
        emoji: '💎',
        tagBg: '#B85864',
    },
    {
        id: 'f2',
        productId: 'p2',
        image: 'https://img.rocket.new/generatedImages/rocket_gen_img_18ed727e8-1772212936132.png',
        imageAlt: 'Flat lay of pastel scrunchies and claw clips on a pink background, hair accessories',
        caption: 'Hair game strong 🎀',
        price: '₹199',
        likes: '3.8k',
        tag: 'Butterfly Claw Clip',
        emoji: '🦋',
        tagBg: '#D1636F',
    },
    {
        id: 'f3',
        productId: 'p3',
        image: 'https://images.unsplash.com/photo-1527633412983-d80af308e660',
        imageAlt: 'Close up of pink lip gloss and makeup brushes on a white marble surface, bright and airy beauty',
        caption: 'Gloss is everything ✨',
        price: '₹449',
        likes: '5.1k',
        tag: 'Glossy Lip Set',
        emoji: '💄',
        tagBg: '#E8828F',
    },
    {
        id: 'f4',
        productId: 'p5',
        image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1156adfd8-1767353505898.png',
        imageAlt: 'Pearl bracelet and gold rings on a pink marble surface, elegant feminine jewellery',
        caption: 'Pearl era loading… 🤍',
        price: '₹499',
        likes: '6.3k',
        tag: 'Pearl Drop Bracelet',
        emoji: '🤍',
        tagBg: '#F6D3D6',
    },
    {
        id: 'f5',
        productId: 'p4',
        image: 'https://images.unsplash.com/photo-1729866680589-1501f6611a28',
        imageAlt: 'Pastel mini bag and plush charm on lavender background, kawaii accessories',
        caption: 'Bag charm obsession 🧸',
        price: '₹349',
        likes: '2.9k',
        tag: 'Mini Teddy Bag Charm',
        emoji: '🧸',
        tagBg: '#D1636F',
    },
    {
        id: 'f6',
        productId: 'p6',
        image: 'https://images.unsplash.com/photo-1502463471782-7626cbfc7d2b',
        imageAlt: 'Pink floral pouch on a cream background, bright and well-lit gift-ready organiser',
        caption: 'Organised & cute 🌸',
        price: '₹649',
        likes: '3.4k',
        tag: 'Floral Organiser Pouch',
        emoji: '🌸',
        tagBg: '#B85864',
    },
];

export default function InstagramCarousel() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [addedId, setAddedId] = useState<string | null>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const handleAddToBag = (e: React.MouseEvent, item: FeedItem) => {
        e.preventDefault();
        addToCart(item.productId, 1);
        setAddedId(item.productId);
        setTimeout(() => setAddedId((current) => (current === item.productId ? null : current)), 1200);
        showToast(`${item.tag} added to your bag`, { href: '/cart', actionLabel: 'View Bag' });
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('active');
                        observer.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.08 }
        );
        sectionRef.current?.querySelectorAll('.reveal, .reveal-scale').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
    };

    return (
        <section ref={sectionRef} className="w-full pt-14 pb-12 overflow-hidden" style={{ background: 'var(--blush-bg)' }}>
            <div className="max-w-screen-xl mx-auto px-4 md:px-10">
                {/* Header */}
                <div className="reveal mb-8 flex items-end justify-between gap-4">
                    <div>
                        <span
                            className="badge-pill mb-3 inline-flex"
                            style={{ background: '#FFFFFF', color: 'var(--blush-rose)', border: '1px solid var(--blush-border)' }}
                        >
                            <span>📸</span> Charm Feed
                        </span>
                        <h2 className="font-elegant-serif text-section-title tracking-tight" style={{ color: 'var(--blush-text)' }}>
                            Shop the{' '}
                            <span style={{ color: 'var(--blush-rose)' }}>Aesthetic</span>
                        </h2>
                    </div>
                    <div className="hidden md:flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="w-11 h-11 rounded-full border bg-white flex items-center justify-center hover:text-white transition-all duration-300"
                            style={{ borderColor: 'var(--blush-border)', color: 'var(--blush-text)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--blush-rose)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blush-rose)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blush-border)'; }}
                        >
                            <Icon name="ChevronLeftIcon" size={18} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-11 h-11 rounded-full border bg-white flex items-center justify-center hover:text-white transition-all duration-300"
                            style={{ borderColor: 'var(--blush-border)', color: 'var(--blush-text)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--blush-rose)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blush-rose)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blush-border)'; }}
                        >
                            <Icon name="ChevronRightIcon" size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scroll container */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto no-scrollbar snap-scroll px-4 md:px-10 pb-4"
            >
                {feedItems.map((item, i) => (
                    <Link
                        key={item.id}
                        href={`/product/${item.productId}`}
                        className="block snap-item min-w-[260px] sm:min-w-[300px] relative rounded-3xl overflow-hidden cursor-pointer reveal-scale shrink-0 card-depth"
                        style={{ transitionDelay: `${i * 80}ms` }}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        {/* Image */}
                        <div className="relative h-[360px] sm:h-[400px] overflow-hidden rounded-3xl">
                            <AppImage
                                src={item.image}
                                alt={item.imageAlt}
                                fill
                                className={`object-cover transition-transform duration-700 ${hoveredId === item.id ? 'scale-110' : 'scale-100'}`}
                                sizes="300px"
                            />
                            {/* Base gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1E1712]/85 via-transparent to-transparent" />

                            {/* Hover overlay */}
                            <div
                                className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 ${hoveredId === item.id ? 'opacity-100' : 'opacity-0'}`}
                                style={{ background: 'rgba(30,23,18,0.55)' }}
                            >
                                <span className="text-white font-elegant-serif font-bold text-2xl">{item.price}</span>
                                <button
                                    onClick={(e) => handleAddToBag(e, item)}
                                    className="text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors shadow-lg"
                                    style={{ background: 'var(--blush-rose)' }}
                                    onMouseEnter={(e) => {
                                        const btn = e.currentTarget as HTMLButtonElement;
                                        btn.style.background = '#FFFFFF';
                                        btn.style.color = 'var(--blush-rose)';
                                    }}
                                    onMouseLeave={(e) => {
                                        const btn = e.currentTarget as HTMLButtonElement;
                                        btn.style.background = 'var(--blush-rose)';
                                        btn.style.color = '#FFFFFF';
                                    }}
                                >
                                    <Icon name={addedId === item.productId ? 'CheckIcon' : 'ShoppingBagIcon'} size={16} />
                                    {addedId === item.productId ? 'Added!' : 'Add to Bag'}
                                </button>
                            </div>

                            {/* Top bar */}
                            <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                                <span
                                    className="badge-pill text-white text-xs shadow"
                                    style={{ background: item.tagBg }}
                                >
                                    {item.emoji} {item.tag}
                                </span>
                                <button
                                    onClick={(e) => e.preventDefault()}
                                    className="w-8 h-8 rounded-full glass-white flex items-center justify-center"
                                >
                                    <Icon name="HeartIcon" size={14} className="text-white" />
                                </button>
                            </div>

                            {/* Bottom info */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                                <p className="text-white font-bold text-sm leading-tight mb-1">{item.caption}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/80 text-xs flex items-center gap-1">
                                        <Icon name="HeartIcon" size={12} style={{ color: 'var(--blush-rose)' }} variant="solid" />
                                        {item.likes} likes
                                    </span>
                                    <span className="font-elegant-serif font-bold text-white text-base">{item.price}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Mobile scroll hint */}
            <div className="flex md:hidden justify-center mt-4 gap-1.5 px-4">
                {feedItems.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'w-5 bg-[#E8828F]' : 'w-1.5 bg-[#EBD9D5]'}`}
                    />
                ))}
            </div>
        </section>
    );
}
