import { createClient } from '@/lib/supabase/server';
import type { DbCombo, DbComboProduct } from '@/lib/supabase/types';
import ComboManager, { type ComboWithProducts, type ComboProductOption } from './ComboManager';

export default async function AdminCombosPage() {
    const supabase = await createClient();
    const [{ data: combos }, { data: comboProducts }, { data: products }] = await Promise.all([
        supabase.from('combos').select('*').order('created_at', { ascending: false }),
        supabase.from('combo_products').select('*'),
        supabase.from('products').select('id, name, price').eq('is_active', true).order('name', { ascending: true }),
    ]);

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
            <div className="mb-8 animate-enter">
                <h1 className="font-elegant-serif text-3xl md:text-[2.25rem]" style={{ color: 'var(--blush-text)' }}>
                    Combos
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--blush-muted)' }}>
                    Cross-product discounts — pick 2+ products; once a shopper has all of them in their bag, a percentage discount applies automatically.
                </p>
            </div>
            <ComboManager combos={combosWithProducts} products={(products as ComboProductOption[]) ?? []} />
        </div>
    );
}
