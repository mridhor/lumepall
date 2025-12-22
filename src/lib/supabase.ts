import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SNOBOL_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SNOBOL_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create client only if env vars are present
let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
} else {
    console.warn('Supabase environment variables not configured. Using fallback data.')
}

export const supabase = supabaseClient as SupabaseClient;
export const isSupabaseConfigured = !!supabaseClient;
