import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductDetailInteractive from './ProductDetailInteractive';
import { getAllActiveProducts, getProductBySlug, getRelatedProducts, getCategoryBySlug, getProductImages, getProductVariants } from '@/lib/supabase/products-data';
import { resolveGalleryImages } from '@/lib/supabase/product-gallery';

export async function generateStaticParams() {
    const products = await getAllActiveProducts();
    return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return {};
    return {
        title: `${product.name} | Charm Avenue by Nandini`,
        description: product.description,
    };
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) notFound();

    const [related, category, galleryRows, variants] = await Promise.all([
        getRelatedProducts(product),
        getCategoryBySlug(product.categorySlug),
        getProductImages(product.id),
        getProductVariants(product.id),
    ]);
    const images = resolveGalleryImages(
        { url: product.image, alt: product.imageAlt },
        galleryRows.map((row) => ({ url: row.url, alt: row.alt, sort_order: row.sort_order }))
    );

    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />

            <section className="w-full px-4 md:px-10 pt-28 md:pt-32 pb-16">
                <div className="max-w-screen-2xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="flex items-center flex-wrap gap-1.5 text-xs font-semibold mb-6" style={{ color: 'var(--blush-muted)' }}>
                        <Link href="/" className="hover:opacity-70 transition-opacity">Home</Link>
                        <span style={{ color: 'var(--blush-border)' }}>/</span>
                        <Link href="/shop" className="hover:opacity-70 transition-opacity">Shop</Link>
                        <span style={{ color: 'var(--blush-border)' }}>/</span>
                        <Link href={`/shop/${product.categorySlug}`} className="hover:opacity-70 transition-opacity">
                            {product.category}
                        </Link>
                        <span style={{ color: 'var(--blush-border)' }}>/</span>
                        <span style={{ color: 'var(--blush-text)' }}>{product.name}</span>
                    </nav>

                    <ProductDetailInteractive
                        productId={product.id}
                        productName={product.name}
                        categorySlug={product.categorySlug}
                        categoryTitle={product.category}
                        emoji={product.emoji}
                        rating={product.rating}
                        reviewCount={product.reviewCount}
                        description={product.description}
                        price={product.price}
                        originalPrice={product.originalPrice ?? null}
                        tag={product.tag}
                        tagBg={product.tagBg}
                        tagText={product.tagText}
                        galleryImages={images}
                        variants={variants}
                        personalizationEnabled={product.personalizationEnabled}
                        personalizationLabel={product.personalizationLabel}
                        personalizationRequired={product.personalizationRequired}
                        personalizationMaxLength={product.personalizationMaxLength}
                        saleStartsAt={product.saleStartsAt}
                        saleEndsAt={product.saleEndsAt}
                        stockStatus={product.stockStatus}
                        madeToOrderLeadTime={product.madeToOrderLeadTime}
                        lowStockThreshold={product.lowStockThreshold}
                        stockCount={product.stockCount}
                        dimensions={product.dimensions}
                        material={product.material}
                        careInstructions={product.careInstructions}
                    />

                    {/* Related products */}
                    {related.length > 0 && (
                        <div className="mt-20">
                            <h2 className="font-elegant-serif text-2xl md:text-3xl tracking-tight mb-6" style={{ color: 'var(--blush-text)' }}>
                                More from {category?.title ?? product.category}
                            </h2>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(9rem,34vw,18rem),1fr))] gap-3 md:gap-4">
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
