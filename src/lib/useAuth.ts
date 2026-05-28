/* Auth hook — Supabase if configured, otherwise a local-only fake.
 * The UI doesn't care which backend serves it. */

import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';

export interface SessionUser {
  id: string;
  email: string;
  initials: string;
}

function initialsOf(email: string, firstName?: string): string {
  if (firstName) return firstName.trim().slice(0, 2).toUpperCase();
  const [name] = email.split('@');
  return (name[0] || '?').toUpperCase() + (name[1] || '').toUpperCase();
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: load existing Supabase session (if any).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) {
        // Fallback to a local stub user (per-tab)
        const stored = localStorage.getItem('tt:user');
        if (stored && !cancelled) setUser(JSON.parse(stored));
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      const su = data.session?.user;
      if (su && !cancelled) {
        setUser({ id: su.id, email: su.email || '', initials: initialsOf(su.email || '') });
      }
      setLoading(false);
    })();

    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        const su = session?.user;
        setUser(su ? { id: su.id, email: su.email || '', initials: initialsOf(su.email || '') } : null);
      });
      return () => { cancelled = true; sub.subscription.unsubscribe(); };
    }
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!supabase) {
      const u = { id: 'local-' + email, email, initials: initialsOf(email) };
      setUser(u);
      localStorage.setItem('tt:user', JSON.stringify(u));
      return;
    }
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) setError(e.message);
  }, []);

  const signUp = useCallback(async (email: string, password: string, firstName: string) => {
    setError(null);
    if (!supabase) {
      const u = { id: 'local-' + email, email, initials: initialsOf(email, firstName) };
      setUser(u);
      localStorage.setItem('tt:user', JSON.stringify(u));
      return;
    }
    const { error: e } = await supabase.auth.signUp({
      email, password,
      options: { data: { first_name: firstName } },
    });
    if (e) setError(e.message);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('tt:user');
    setUser(null);
  }, []);

  return { user, loading, error, signIn, signUp, signOut, isSupabase: isSupabaseConfigured };
}
