export interface Product {
    id: string;
    name: string;
    categorySlug: CategorySlug;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    imageAlt: string;
    tag?: string;
    tagBg?: string;
    tagText?: string;
    emoji: string;
    description: string;
    rating: number;
    reviewCount: number;
}

export type CategorySlug = 'jewellery' | 'hair' | 'makeup' | 'accessories' | 'pouches';

export interface Category {
    slug: CategorySlug;
    title: string;
    subtitle: string;
    emoji: string;
    tag: string;
    image: string;
    imageAlt: string;
    tagBg: string;
    tagText: string;
    description: string;
}

export const CATEGORIES: Category[] = [
    {
        slug: 'jewellery',
        title: 'Anti-Tarnish Jewellery',
        subtitle: 'Rings · Bracelets · Neckchains · Watches',
        emoji: '💍',
        tag: 'Best Seller',
        image: 'https://images.unsplash.com/photo-1621311628038-01cd988520c2',
        imageAlt: 'Gold and silver rings and bracelets laid on a pink marble surface, warm feminine jewellery flat lay',
        tagBg: '#E8828F',
        tagText: '#FFFFFF',
        description: 'Jewellery that stays as pretty as day one. Every piece is anti-tarnish coated so your rings, bracelets and neckchains keep their shine wear after wear.',
    },
    {
        slug: 'hair',
        title: 'Kawaii Hair Accessories',
        subtitle: 'Claw Clips · Scrunchies · Skincare Bands',
        emoji: '🎀',
        tag: 'Trending',
        image: 'https://img.rocket.new/generatedImages/rocket_gen_img_18ed727e8-1772212936132.png',
        imageAlt: 'Colourful scrunchies and claw clips arranged on a pastel pink background, hair accessories flatlay',
        tagBg: '#D1636F',
        tagText: '#FFFFFF',
        description: 'Cute, comfy hair essentials for everyday and every mood — from gentle satin scrunchies to statement claw clips.',
    },
    {
        slug: 'makeup',
        title: 'Cute Makeup',
        subtitle: 'Lip Glosses · Beauty Blenders · Nail Extensions',
        emoji: '💄',
        tag: 'New In',
        image: 'https://img.rocket.new/generatedImages/rocket_gen_img_103b67372-1767194170606.png',
        imageAlt: 'Pink and nude lip glosses and makeup brushes on a white vanity, feminine beauty product flatlay',
        tagBg: '#F6D3D6',
        tagText: '#1E1712',
        description: 'Playful makeup finds that make getting ready the best part of your day — glossy, glittery, always cute.',
    },
    {
        slug: 'accessories',
        title: 'Trending Accessories',
        subtitle: 'Bag Charms · Coin Pouches · Keycuties · Plushies',
        emoji: '🧸',
        tag: 'Viral',
        image: 'https://images.unsplash.com/photo-1671602391194-3be89fb687dc',
        imageAlt: 'Pastel mini bags and plush charms on a lavender background, cute kawaii accessories',
        tagBg: '#B85864',
        tagText: '#FFFFFF',
        description: 'The little extras that make an outfit — viral bag charms, mini wallets and plushies to clip onto everything.',
    },
    {
        slug: 'pouches',
        title: 'Organiser Pouches',
        subtitle: 'Jewellery Cases · Makeup Bags · Travel Kits',
        emoji: '👜',
        tag: 'Gift Ready',
        image: 'https://images.unsplash.com/photo-1591375372245-6d76eb0531cd',
        imageAlt: 'Pink and floral zippered pouches and cosmetic bags arranged on a light background, gift-ready organiser',
        tagBg: '#D1636F',
        tagText: '#FFFFFF',
        description: 'Keep your charm collection tidy and gift-ready with our zippered pouches, jewellery cases and travel kits.',
    },
];

export const PRODUCTS: Product[] = [
    {
        id: 'p1',
        name: 'Dainty Star Ring',
        categorySlug: 'jewellery',
        category: 'Anti-Tarnish Jewellery',
        price: 299,
        originalPrice: 499,
        image: 'https://images.unsplash.com/photo-1721103428007-8d466bf9ee00',
        imageAlt: 'Delicate gold star ring on a soft pink background, anti-tarnish finish',
        tag: 'Hot 🔥',
        tagBg: '#E8828F',
        tagText: '#FFFFFF',
        emoji: '⭐',
        description: 'A dainty star-shaped ring in warm gold-tone anti-tarnish plating. Adjustable band fits most sizes, perfect for everyday stacking or gifting.',
        rating: 4.8,
        reviewCount: 214,
    },
    {
        id: 'p2',
        name: 'Butterfly Claw Clip',
        categorySlug: 'hair',
        category: 'Kawaii Hair Accessories',
        price: 199,
        image: 'https://img.rocket.new/generatedImages/rocket_gen_img_14860b929-1772356988721.png',
        imageAlt: 'Pastel butterfly claw clip on a lavender background, cute hair accessory',
        tag: 'Trending',
        tagBg: '#D1636F',
        tagText: '#FFFFFF',
        emoji: '🦋',
        description: 'A pastel butterfly claw clip with a strong grip and gentle teeth that won’t snag your hair. Great for thick or thin hair alike.',
        rating: 4.7,
        reviewCount: 168,
    },
    {
        id: 'p3',
        name: 'Glossy Lip Set (3pc)',
        categorySlug: 'makeup',
        category: 'Cute Makeup',
        price: 449,
        originalPrice: 699,
        image: 'https://images.unsplash.com/photo-1570088727237-68500d217455',
        imageAlt: 'Three sheer pink lip glosses on a white surface, cute makeup product',
        tag: 'New In ✨',
        tagBg: '#F6D3D6',
        tagText: '#1E1712',
        emoji: '💄',
        description: 'A set of three sheer, non-sticky lip glosses in wearable pink shades — buildable colour with a glassy, hydrating finish.',
        rating: 4.9,
        reviewCount: 302,
    },
    {
        id: 'p4',
        name: 'Mini Teddy Bag Charm',
        categorySlug: 'accessories',
        category: 'Trending Accessories',
        price: 349,
        image: 'https://images.unsplash.com/photo-1724645550639-0dd96a8fca5d',
        imageAlt: 'Tiny plush teddy bear bag charm in pastel pink, kawaii accessory',
        tag: 'Viral 🧸',
        tagBg: '#D1636F',
        tagText: '#FFFFFF',
        emoji: '🧸',
        description: 'A tiny plush teddy bear charm with a secure clip, ready to hang on your bag, backpack or keychain.',
        rating: 4.6,
        reviewCount: 97,
    },
    {
        id: 'p5',
        name: 'Pearl Drop Bracelet',
        categorySlug: 'jewellery',
        category: 'Anti-Tarnish Jewellery',
        price: 499,
        originalPrice: 799,
        image: 'https://images.unsplash.com/photo-1638332746343-b8494c8f5dce',
        imageAlt: 'Delicate pearl bracelet with gold accents on a pink marble surface',
        tag: 'Best Seller',
        tagBg: '#E8828F',
        tagText: '#FFFFFF',
        emoji: '🤍',
        description: 'Freshwater-style pearl drops on a gold-tone anti-tarnish chain, with an adjustable extender for the perfect fit.',
        rating: 4.9,
        reviewCount: 256,
    },
    {
        id: 'p6',
        name: 'Floral Organiser Pouch',
        categorySlug: 'pouches',
        category: 'Organiser Pouches',
        price: 649,
        originalPrice: 999,
        image: 'https://images.unsplash.com/photo-1502463471782-7626cbfc7d2b',
        imageAlt: 'Pink floral zippered pouch on a cream background, organiser bag',
        tag: 'Gift ❤️',
        tagBg: '#D1636F',
        tagText: '#FFFFFF',
        emoji: '🌸',
        description: 'A floral zippered pouch with internal compartments — perfect for keeping jewellery, makeup or travel essentials tangle-free.',
        rating: 4.8,
        reviewCount: 134,
    },
    {
        id: 'p7',
        name: 'Satin Scrunchie Set',
        categorySlug: 'hair',
        category: 'Kawaii Hair Accessories',
        price: 249,
        image: 'https://images.unsplash.com/photo-1586212699614-73a87e6c79e0',
        imageAlt: 'Set of satin scrunchies in pastel colours on a pink background',
        emoji: '🎀',
        description: 'A set of soft satin scrunchies in pastel shades, gentle on hair with no creasing — great for everyday wear or sleeping in.',
        rating: 4.7,
        reviewCount: 189,
    },
    {
        id: 'p8',
        name: 'Crystal Neck Chain',
        categorySlug: 'jewellery',
        category: 'Anti-Tarnish Jewellery',
        price: 799,
        originalPrice: 1299,
        image: 'https://images.unsplash.com/photo-1708222169717-8251cfdfa608',
        imageAlt: 'Delicate crystal pendant necklace on a soft white background, anti-tarnish jewellery',
        tag: 'Premium 💎',
        tagBg: '#B85864',
        tagText: '#FFFFFF',
        emoji: '💎',
        description: 'A crystal pendant on a fine anti-tarnish chain — dainty enough for daily wear, sparkly enough for a night out.',
        rating: 4.9,
        reviewCount: 178,
    },
    {
        id: 'p9',
        name: 'Gel Nail Extension Kit',
        categorySlug: 'makeup',
        category: 'Cute Makeup',
        price: 899,
        originalPrice: 1499,
        image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1f04ffe3e-1767084611690.png',
        imageAlt: 'Pink and nude gel nail extension kit spread on a white surface',
        tag: 'DIY Kit',
        tagBg: '#F6D3D6',
        tagText: '#1E1712',
        emoji: '💅',
        description: 'An at-home gel nail extension kit with everything you need for a salon-style manicure — no appointment needed.',
        rating: 4.5,
        reviewCount: 88,
    },
];

export function getProductById(id: string): Product | undefined {
    return PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(slug: CategorySlug): Product[] {
    return PRODUCTS.filter((p) => p.categorySlug === slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
    return CATEGORIES.find((c) => c.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
    return PRODUCTS.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, limit);
}
