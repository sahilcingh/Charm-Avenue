import { createClient } from '@/lib/supabase/server';
import type { DbHomepageSection, DbHomepageSectionProduct } from '@/lib/supabase/types';
import HomepageSectionsManager, {
  type SectionWithProducts,
  type SectionProductOption,
} from './HomepageSectionsManager';

export default async function AdminHomepagePage() {
  const supabase = await createClient();
  const [{ data: sections }, { data: sectionProducts }, { data: products }] = await Promise.all([
    supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true }),
    supabase.from('homepage_section_products').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, price')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  const productIdsBySection = new Map<string, string[]>();
  ((sectionProducts as DbHomepageSectionProduct[]) ?? []).forEach((sp) => {
    const list = productIdsBySection.get(sp.section_id) ?? [];
    list.push(sp.product_id);
    productIdsBySection.set(sp.section_id, list);
  });

  const sectionsWithProducts: SectionWithProducts[] = ((sections as DbHomepageSection[]) ?? []).map(
    (section) => ({
      ...section,
      productIds: productIdsBySection.get(section.id) ?? [],
    })
  );

  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-elegant-serif text-3xl md:text-[2.25rem]"
          style={{ color: 'var(--blush-text)' }}
        >
          Homepage Sections
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--blush-muted)' }}>
          Rename any section, pick exactly which products show under it and in what order, reorder
          sections, or add a brand-new one.
        </p>
      </div>
      <HomepageSectionsManager
        sections={sectionsWithProducts}
        products={(products as SectionProductOption[]) ?? []}
      />
    </div>
  );
}
