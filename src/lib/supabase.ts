
import { createClient } from '@supabase/supabase-js';

// Use public Vite environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your environment variables.');
}

// Log the Supabase URL and key to debug (will be redacted in production)
console.log('Supabase URL:', supabaseUrl ? 'URL is defined' : 'URL is undefined');
console.log('Supabase Key:', supabaseAnonKey ? 'Key is defined' : 'Key is undefined');

// Create a fallback URL and key to prevent runtime errors
// NOTE: In production, these should come from environment variables
const url = supabaseUrl || 'https://placeholder-supabase-url.com';
const key = supabaseAnonKey || 'placeholder-anon-key';

// Create and export the Supabase client
export const supabase = createClient(url, key);
