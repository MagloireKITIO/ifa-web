import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Trim values to remove accidental whitespace which causes fetch "Invalid value" errors
const supabaseUrl = envUrl?.trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey?.trim() || 'placeholder';

if (!envUrl || !envKey) {
  console.warn('Missing Supabase environment variables. Using placeholders for build.');
} else {
  // Debug log for production issues (visible in browser console)
  console.log('Supabase Client Initialized with URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
