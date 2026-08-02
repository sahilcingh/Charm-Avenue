import { MetadataRoute } from 'next';
import { getCategories, getAllActiveProducts } from '@/lib/supabase/products-data';
import { SITE_URL } from '@/lib/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const lastModified = new Date();
  const [categories, products] = await Promise.all([getCategories(), getAllActiveProducts()]);

  return [
    { url: `${base}/`, lastModified, priority: 1.0 },
    { url: `${base}/shop`, lastModified, priority: 0.9 },
    { url: `${base}/cart`, lastModified, priority: 0.4 },
    ...categories.map((cat) => ({
      url: `${base}/shop/${cat.slug}`,
      lastModified,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/product/${product.slug}`,
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
