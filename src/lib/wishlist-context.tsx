'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from './supabase/client';

export type ToggleWishlistResult =
  | 'added'
  | 'removed'
  | 'not-logged-in'
  | 'invalid-product'
  | 'error';

interface WishlistContextValue {
  count: number;
  isLoggedIn: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<ToggleWishlistResult>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const loadWishlist = async (uid: string) => {
      const { data } = await supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', uid);
      if (!active) return;
      setWishlistIds(new Set((data ?? []).map((row) => row.product_id as string)));
    };

    const applyUser = (uid: string | null) => {
      setUserId(uid);
      if (uid) {
        loadWishlist(uid);
      } else {
        setWishlistIds(new Set());
      }
    };

    supabase.auth.getUser().then(({ data }) => applyUser(data.user?.id ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (productId: string): Promise<ToggleWishlistResult> => {
      if (!productId || !productId.trim()) return 'invalid-product';
      if (!userId) return 'not-logged-in';

      const supabase = createClient();
      if (wishlistIds.has(productId)) {
        const { error } = await supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);
        if (error) return 'error';
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        return 'removed';
      }

      const { error } = await supabase
        .from('wishlist_items')
        .insert({ user_id: userId, product_id: productId });
      if (error) return 'error';
      setWishlistIds((prev) => new Set(prev).add(productId));
      return 'added';
    },
    [userId, wishlistIds]
  );

  const value = useMemo(
    () => ({ count: wishlistIds.size, isLoggedIn: !!userId, isInWishlist, toggleWishlist }),
    [wishlistIds, userId, isInWishlist, toggleWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
