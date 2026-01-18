import { createBrowserClient } from '@supabase/ssr';

/** Check if Supabase is configured. Use before auth calls to show a clear error instead of "Failed to fetch". */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return !!url && !!key && !url.includes('placeholder');
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to apps/web/.env.local and restart the dev server. See README.md for setup.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

