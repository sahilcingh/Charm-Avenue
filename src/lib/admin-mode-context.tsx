'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from './supabase/client';

export const ADMIN_MODE_STORAGE_KEY = 'charm-avenue-admin-mode';

interface AdminModeContextValue {
  isAdmin: boolean;
  adminModeOn: boolean;
  toggleAdminMode: () => void;
}

/**
 * A stored "on" preference from a previous admin session must never leak to a
 * different, non-admin account signed into the same browser — the toggle only
 * ever reflects the current user's own admin status.
 */
export function resolveAdminModeState({
  isAdmin,
  storedPreference,
}: {
  isAdmin: boolean;
  storedPreference: boolean;
}): boolean {
  if (!isAdmin) return false;
  return storedPreference;
}

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [storedPreference, setStoredPreference] = useState(false);

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

  useEffect(() => {
    // Some mobile browsers (Safari private browsing, strict tracking-prevention
    // settings, sandboxed in-app browsers) throw a SecurityError just from
    // touching window.localStorage — this must never take the whole app down,
    // it just means the preference can't persist for that visitor.
    try {
      setStoredPreference(window.localStorage.getItem(ADMIN_MODE_STORAGE_KEY) === 'true');
    } catch {
      // ignore unavailable storage
    }
  }, []);

  const adminModeOn = resolveAdminModeState({ isAdmin, storedPreference });

  const toggleAdminMode = useCallback(() => {
    setStoredPreference((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(ADMIN_MODE_STORAGE_KEY, String(next));
      } catch {
        // ignore unavailable storage — the toggle still works for this session,
        // it just won't persist across a reload
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ isAdmin, adminModeOn, toggleAdminMode }),
    [isAdmin, adminModeOn, toggleAdminMode]
  );

  return <AdminModeContext.Provider value={value}>{children}</AdminModeContext.Provider>;
}

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error('useAdminMode must be used within an AdminModeProvider');
  return ctx;
}
