'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase/client';

interface IsAdminContextValue {
  isAdmin: boolean;
}

const IsAdminContext = createContext<IsAdminContextValue | null>(null);

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const applyUser = async (user: { id: string } | null) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      setIsAdmin(profile?.is_admin ?? false);
    };

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return <IsAdminContext.Provider value={{ isAdmin }}>{children}</IsAdminContext.Provider>;
}

export function useAdminMode() {
  const ctx = useContext(IsAdminContext);
  if (!ctx) throw new Error('useAdminMode must be used within an AdminModeProvider');
  return ctx;
}
