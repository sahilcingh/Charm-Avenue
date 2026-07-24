'use client';
import { useEffect, useState } from 'react';
import { createClient } from './supabase/client';

const RESULT_LIMIT = 6;
const DEBOUNCE_MS = 250;

export interface LiveSearchResult {
  id: string;
  slug: string;
  name: string;
  image: string;
  imageAlt: string;
  price: number;
}

/** Debounced, live "as you type" product matches for the header search dropdown — a lighter, capped query than the full /search results page. */
export function useLiveProductSearch(query: string) {
  const [results, setResults] = useState<LiveSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('id, slug, name, image, image_alt, price')
        .eq('is_active', true)
        .ilike('name', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(RESULT_LIMIT);

      if (cancelled) return;
      setResults(
        (data ?? []).map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          image: row.image,
          imageAlt: row.image_alt,
          price: row.price,
        }))
      );
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, loading };
}
