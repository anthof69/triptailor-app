/* Auth hook — Supabase if configured, otherwise a local-only fake.
 * The UI doesn't care which backend serves it. */

import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';

export interface SessionUser {
  id: string;
  email: string;
  initials: string;
}

export type AuthResult =
  | { ok: true; needsEmailConfirm?: boolean }
  | { ok: false; error: string };

// Map common Supabase / network errors to readable French.
function frError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('failed to fetch') || m.includes('network')) return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('email not confirmed')) return 'Confirmez votre email avant de vous connecter (vérifiez vos mails).';
  if (m.includes('user already registered') || m.includes('already been registered')) return 'Un compte existe déjà avec cet email. Connectez-vous.';
  if (m.includes('password should be at least')) return 'Mot de passe trop court (6 caractères minimum).';
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives. Patientez une minute.';
  return msg;
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

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setError(null);
    if (!supabase) {
      const u = { id: 'local-' + email, email, initials: initialsOf(email) };
      setUser(u);
      localStorage.setItem('tt:user', JSON.stringify(u));
      return { ok: true };
    }
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) { const fe = frError(e.message); setError(fe); return { ok: false, error: fe }; }
    return { ok: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string, firstName: string): Promise<AuthResult> => {
    setError(null);
    if (!supabase) {
      const u = { id: 'local-' + email, email, initials: initialsOf(email, firstName) };
      setUser(u);
      localStorage.setItem('tt:user', JSON.stringify(u));
      return { ok: true };
    }
    const { data, error: e } = await supabase.auth.signUp({
      email, password,
      options: { data: { first_name: firstName } },
    });
    if (e) { const fe = frError(e.message); setError(fe); return { ok: false, error: fe }; }
    // When email confirmation is ON, Supabase returns a user but no active session.
    const needsEmailConfirm = !data.session && !!data.user;
    return { ok: true, needsEmailConfirm };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('tt:user');
    setUser(null);
  }, []);

  return { user, loading, error, signIn, signUp, signOut, isSupabase: isSupabaseConfigured };
}
