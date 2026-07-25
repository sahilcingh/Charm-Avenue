'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase/client';

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: { name?: string };
}

interface IsAdminContextValue {
  isAdmin: boolean;
  user: AuthUser | null;
}

const IsAdminContext = createContext<IsAdminContextValue | null>(null);

/**
 * The single client-side "who is logged in" check for the whole app — Header used to run its
 * own separate auth.getUser()/onAuthStateChange pair just to get the account initial, duplicating
 * the exact same round-trip this provider already makes. Every consumer (Header's account icon,
 * the admin button, ProductCard's edit affordance) now reads off this one subscription instead.
 */
export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const applyUser = async (nextUser: AuthUser | null) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', nextUser.id)
        .single();
      setIsAdmin(profile?.is_admin ?? false);
    };

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return <IsAdminContext.Provider value={{ isAdmin, user }}>{children}</IsAdminContext.Provider>;
}

export function useAdminMode() {
  const ctx = useContext(IsAdminContext);
  if (!ctx) throw new Error('useAdminMode must be used within an AdminModeProvider');
  return ctx;
}
