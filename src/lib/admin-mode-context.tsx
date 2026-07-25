'use client';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createClient } from './supabase/client';

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: { name?: string };
}

interface IsAdminContextValue {
  isAdmin: boolean;
  user: AuthUser | null;
  /** Re-checks admin status for the current user and returns it — callers that need the
   *  answer immediately after signing in (e.g. LoginForm deciding where to redirect) should use
   *  this instead of running their own separate `profiles` query, since a fresh sign-in also
   *  fires this provider's own onAuthStateChange check around the same time; both share a single
   *  in-flight request per user id rather than each firing their own round trip. */
  refreshIsAdmin: () => Promise<boolean>;
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
  const inFlight = useRef<{ userId: string; promise: Promise<boolean> } | null>(null);

  const checkIsAdmin = (userId: string): Promise<boolean> => {
    if (inFlight.current?.userId === userId) return inFlight.current.promise;
    const supabase = createClient();
    const promise: Promise<boolean> = Promise.resolve(
      supabase.from('profiles').select('is_admin').eq('id', userId).single()
    ).then(({ data }) => data?.is_admin ?? false);
    inFlight.current = { userId, promise };
    promise.finally(() => {
      if (inFlight.current?.promise === promise) inFlight.current = null;
    });
    return promise;
  };

  useEffect(() => {
    const supabase = createClient();

    const applyUser = async (nextUser: AuthUser | null) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(await checkIsAdmin(nextUser.id));
    };

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshIsAdmin = async (): Promise<boolean> => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setIsAdmin(false);
      return false;
    }
    const admin = await checkIsAdmin(data.user.id);
    setIsAdmin(admin);
    return admin;
  };

  return (
    <IsAdminContext.Provider value={{ isAdmin, user, refreshIsAdmin }}>
      {children}
    </IsAdminContext.Provider>
  );
}

export function useAdminMode() {
  const ctx = useContext(IsAdminContext);
  if (!ctx) throw new Error('useAdminMode must be used within an AdminModeProvider');
  return ctx;
}
