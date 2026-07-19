import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import ProductCard from '@/components/ProductCard';
import AddToCartButton from './AddToCartButton';
import { PRODUCTS, getProductById, getRelatedProducts, getCategoryBySlug } from '@/lib/products';

export function generateStaticParams() {
    return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const product = getProductById(id);
    if (!product) return {};
    return {
        title: `${product.name} | Charm Avenue by Nandini`,
        description: product.description,
    };
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const product = getProductById(id);
    if (!product) notFound();

    const related = getRelatedProducts(product);
    const category = getCategoryBySlug(product.categorySlug);
    const discountPct = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

    return (
        <main className="min-h-screen bg-[#FFF0F7] overflow-x-hidden">
            <Header variant="solid" />

            <section className="w-full px-4 md:px-10 pt-28 md:pt-32 pb-16">
                <div className="max-w-screen-xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-[#9B4070] mb-6">
                        <Link href="/" className="hover:text-[#E91E8C] transition-colors">Home</Link>
                        <span className="text-[#FFB3E0]">/</span>
                        <Link href="/shop" className="hover:text-[#E91E8C] transition-colors">Shop</Link>
                        <span className="text-[#FFB3E0]">/</span>
                        <Link href={`/shop/${product.categorySlug}`} className="hover:text-[#E91E8C] transition-colors">
                            {product.category}
                        </Link>
                        <span className="text-[#FFB3E0]">/</span>
                        <span className="text-[#3D0030]">{product.name}</span>
                    </nav>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-14">
                        {/* Image */}
                        <div className="relative aspect-square rounded-4xl overflow-hidden card-bubble">
                            <AppImage
                                src={product.image}
                                alt={product.imageAlt}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                            {product.tag && (
                                <span
                                    className="absolute top-4 left-4 badge-pill shadow-sm"
                                    style={{ background: product.tagBg, color: product.tagText }}
                                >
                                    {product.tag}
                                </span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col">
                            <Link
                                href={`/shop/${product.categorySlug}`}
                                className="text-[#E91E8C] text-sm font-bold uppercase tracking-widest mb-2 hover:underline"
                            >
                                {product.emoji} {product.category}
                            </Link>
                            <h1 className="font-display font-black text-[#3D0030] text-3xl md:text-4xl tracking-tight mb-3">
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Icon
                                            key={i}
                                            name="StarIcon"
                                            size={16}
                                            variant="solid"
                                            className={i < Math.round(product.rating) ? 'text-[#E91E8C]' : 'text-[#FFCCE8]'}
                                        />
                                    ))}
                                </div>
                                <span className="text-[#9B4070] text-sm font-medium">
                                    {product.rating} ({product.reviewCount} reviews)
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <span className="font-display font-black text-[#E91E8C] text-3xl">₹{product.price}</span>
                                {product.originalPrice && (
                                    <>
                                        <span className="text-[#9B4070] text-lg line-through">₹{product.originalPrice}</span>
                                        <span className="badge-pill bg-[#FFE4F4] text-[#E91E8C]">{discountPct}% off</span>
                                    </>
                                )}
                            </div>

                            <p className="text-[#3D0030]/80 text-base leading-relaxed mb-8">{product.description}</p>

                            <AddToCartButton productId={product.id} />

                            {/* Trust row */}
                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 card-bubble">
                                    <span className="text-lg">💎</span>
                                    <p className="text-[#3D0030] text-xs font-bold leading-tight">
                                        Anti-Tarnish
                                        <br />
                                        <span className="font-medium text-[#9B4070]">100% Guaranteed</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 card-bubble">
                                    <span className="text-lg">🚀</span>
                                    <p className="text-[#3D0030] text-xs font-bold leading-tight">
                                        Fast Shipping
                                        <br />
                                        <span className="font-medium text-[#9B4070]">Pan India 2–5 days</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related products */}
                    {related.length > 0 && (
                        <div className="mt-20">
                            <h2 className="font-display font-black text-[#3D0030] text-2xl md:text-3xl tracking-tight mb-6">
                                More from {category?.title ?? product.category}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                {related.map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
