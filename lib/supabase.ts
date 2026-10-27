import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Configure the Supabase environment variables.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function configured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}
