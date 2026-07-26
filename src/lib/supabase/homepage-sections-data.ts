import { createPublicClient } from './public-client';
import { mapProductRow, type Product } from './product-mapper';
import type {
  DbCategory,
  DbHomepageSection,
  DbHomepageSectionProduct,
  DbProduct,
  DbProductVariant,
  HomepageSectionLayout,
} from './types';

export interface HomepageSectionData {
  id: string;
  title: string;
  eyebrowEmoji: string;
  eyebrowLabel: string;
  subtitle: string | null;
  layout: HomepageSectionLayout;
  products: Product[];
}

type JoinedProduct = DbProduct & {
  category: Pick<DbCategory, 'title'> | null;
  product_variants: DbProductVariant[] | null;
};

type SectionProductRow = DbHomepageSectionProduct & { product: JoinedProduct | null };

/** Admin-curated homepage sections (title, layout, member products), in display order — see products-phase9-homepage-sections-migration.sql. */
export async function getHomepageSections(): Promise<HomepageSectionData[]> {
  const supabase = createPublicClient();

  const [{ data: sections, error: sectionsError }, { data: sectionProducts }] = await Promise.all([
    supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('homepage_section_products')
      .select(
        '*, product:products(*, category:categories!products_category_slug_fkey(title), product_variants(*))'
      )
      .order('sort_order', { ascending: true }),
  ]);
  if (sectionsError || !sections) return [];

  const productsBySection = new Map<string, Product[]>();
  for (const row of (sectionProducts ?? []) as unknown as SectionProductRow[]) {
    const product = row.product;
    if (!product || !product.is_active) continue;
    const list = productsBySection.get(row.section_id) ?? [];
    list.push(mapProductRow(product, product.category?.title, product.product_variants ?? []));
    productsBySection.set(row.section_id, list);
  }

  return (sections as DbHomepageSection[]).map((section) => ({
    id: section.id,
    title: section.title,
    eyebrowEmoji: section.eyebrow_emoji,
    eyebrowLabel: section.eyebrow_label,
    subtitle: section.subtitle,
    layout: section.layout,
    products: productsBySection.get(section.id) ?? [],
  }));
}
