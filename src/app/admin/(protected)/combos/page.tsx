import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import type { DbCombo, DbComboProduct } from '@/lib/supabase/types';
import ComboManager, { type ComboWithProducts, type ComboProductOption } from './ComboManager';

export default async function AdminCombosPage() {
  const supabase = await createClient();
  const [
    { data: combos, error: combosError },
    { data: comboProducts, error: comboProductsError },
    { data: products, error: productsError },
  ] = await Promise.all([
    supabase.from('combos').select('*').order('created_at', { ascending: false }),
    supabase.from('combo_products').select('*'),
    supabase
      .from('products')
      .select('id, name, price')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);
  const error = combosError ?? comboProductsError ?? productsError;

  const productIdsByCombo = new Map<string, string[]>();
  ((comboProducts as DbComboProduct[]) ?? []).forEach((cp) => {
    const list = productIdsByCombo.get(cp.combo_id) ?? [];
    list.push(cp.product_id);
    productIdsByCombo.set(cp.combo_id, list);
  });

  const combosWithProducts: ComboWithProducts[] = ((combos as DbCombo[]) ?? []).map((combo) => ({
    ...combo,
    productIds: productIdsByCombo.get(combo.id) ?? [],
  }));

  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-elegant-serif text-3xl md:text-[2.25rem]"
          style={{ color: 'var(--blush-text)' }}
        >
          Combos
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--blush-muted)' }}>
          Cross-product discounts: pick 2+ products; once a shopper has all of them in their bag, a
          percentage discount applies automatically.
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
            Couldn&apos;t load combos: {error.message}.
          </p>
        </div>
      ) : (
        <ComboManager
          combos={combosWithProducts}
          products={(products as ComboProductOption[]) ?? []}
        />
      )}
    </div>
  );
}
