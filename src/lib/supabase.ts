import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = envUrl && envUrl.length > 0 ? envUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey && envKey.length > 0 ? envKey : 'placeholder';

if (!envUrl || !envKey) {
  console.warn('Missing Supabase environment variables. Using placeholders for build.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
