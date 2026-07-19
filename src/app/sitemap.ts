import { MetadataRoute } from 'next';
import { CATEGORIES, PRODUCTS } from '@/lib/products';

export default function sitemap(): MetadataRoute.Sitemap {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const lastModified = new Date();

    return [
        { url: `${base}/`, lastModified, priority: 1.0 },
        { url: `${base}/shop`, lastModified, priority: 0.9 },
        { url: `${base}/cart`, lastModified, priority: 0.4 },
        ...CATEGORIES.map((cat) => ({
            url: `${base}/shop/${cat.slug}`,
            lastModified,
            priority: 0.8,
        })),
        ...PRODUCTS.map((product) => ({
            url: `${base}/product/${product.id}`,
            lastModified,
            priority: 0.7,
        })),
        { url: `${base}/about`, lastModified, priority: 0.5 },
        { url: `${base}/contact`, lastModified, priority: 0.5 },
        { url: `${base}/shipping-policy`, lastModified, priority: 0.3 },
        { url: `${base}/returns`, lastModified, priority: 0.3 },
        { url: `${base}/privacy`, lastModified, priority: 0.3 },
        { url: `${base}/terms`, lastModified, priority: 0.3 },
    ];
}