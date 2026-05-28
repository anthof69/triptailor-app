/* Saved-trips hook. Backed by Supabase when a user is logged in;
 * otherwise persists to localStorage (so anonymous browsing still works).
 * Same shape in both modes: { trips, add, remove } where `trips` is
 * an array of { iso, month, addedAt }. */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { SessionUser } from './useAuth';

export interface SavedTrip {
  iso: string;
  month: number;
  addedAt: string;
}

const LS_KEY = 'tt:savedTrips';

function readLocal(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}
function writeLocal(trips: SavedTrip[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(trips)); } catch { /* ignore */ }
}

export function useSavedTrips(user: SessionUser | null) {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  // Load on mount / on user change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (supabase && user) {
        // One-shot migration: push any trips saved while logged out into the
        // user's account, then clear the local cache so nothing is lost.
        const local = readLocal();
        if (local.length > 0) {
          const rows = local.map(t => ({ user_id: user.id, iso: t.iso, month: t.month, added_at: t.addedAt }));
          const { error: migErr } = await supabase
            .from('saved_trips')
            .upsert(rows, { onConflict: 'user_id,iso' });
          if (migErr) console.error('saved_trips migration failed', migErr);
          else localStorage.removeItem(LS_KEY);
        }

        const { data, error } = await supabase
          .from('saved_trips')
          .select('iso, month, added_at')
          .eq('user_id', user.id)
          .order('added_at', { ascending: false });
        if (cancelled) return;
        if (error) { console.error('saved_trips select failed', error); setTrips([]); }
        else setTrips((data || []).map(r => ({ iso: r.iso, month: r.month, addedAt: r.added_at })));
      } else {
        if (!cancelled) setTrips(readLocal());
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const add = useCallback(async (iso: string, month: number) => {
    const entry: SavedTrip = { iso, month, addedAt: new Date().toISOString() };
    setTrips(prev => {
      if (prev.some(t => t.iso === iso)) return prev;
      const next = [entry, ...prev];
      if (!supabase || !user) writeLocal(next);
      return next;
    });
    if (supabase && user) {
      const { error } = await supabase.from('saved_trips').upsert(
        { user_id: user.id, iso, month, added_at: entry.addedAt },
        { onConflict: 'user_id,iso' },
      );
      if (error) console.error('saved_trips upsert failed', error);
    }
  }, [user?.id]);

  const remove = useCallback(async (iso: string) => {
    setTrips(prev => {
      const next = prev.filter(t => t.iso !== iso);
      if (!supabase || !user) writeLocal(next);
      return next;
    });
    if (supabase && user) {
      const { error } = await supabase.from('saved_trips').delete().match({ user_id: user.id, iso });
      if (error) console.error('saved_trips delete failed', error);
    }
  }, [user?.id]);

  return { trips, loading, add, remove };
}
