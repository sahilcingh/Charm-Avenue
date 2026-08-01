import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import type { DbHomepageSection, DbHomepageSectionProduct } from '@/lib/supabase/types';
import HomepageSectionsManager, {
  type SectionWithProducts,
  type SectionProductOption,
} from './HomepageSectionsManager';

export default async function AdminHomepagePage() {
  const supabase = await createClient();
  const [
    { data: sections, error: sectionsError },
    { data: sectionProducts, error: sectionProductsError },
    { data: products, error: productsError },
  ] = await Promise.all([
    supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true }),
    supabase.from('homepage_section_products').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, price')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);
  const error = sectionsError ?? sectionProductsError ?? productsError;

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
      {error ? (
        <div className="bg-white rounded-3xl p-8 card-bubble flex items-start gap-4">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--blush-bg)' }}
          >
            <Icon
              name="ExclamationTriangleIcon"
              size={18}
              style={{ color: 'var(--blush-rose-dark)' }}
            />
          </span>
          <p className="text-sm" style={{ color: 'var(--blush-rose-dark)' }}>
            Couldn&apos;t load homepage sections: {error.message}.
          </p>
        </div>
      ) : (
        <HomepageSectionsManager
          sections={sectionsWithProducts}
          products={(products as SectionProductOption[]) ?? []}
        />
      )}
    </div>
  );
}
