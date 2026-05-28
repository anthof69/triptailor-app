/* Lightweight Supabase client + typed helpers.
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local.
 * If either is missing, exports a stub that throws on use — the app
 * still runs, but any call goes through localStorage instead (see
 * useSavedTrips / useAuth).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL  = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = !!(URL && KEY);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(URL!, KEY!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

// ── Generated-style typings (kept minimal, no codegen needed) ──
export interface SavedTripRow {
  id: string;
  user_id: string;
  iso: string;        // ISO-2 country code
  month: number;      // 0-11
  added_at: string;   // ISO timestamp
}
