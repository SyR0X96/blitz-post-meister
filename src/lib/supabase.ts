
import { createClient } from '@supabase/supabase-js';

// Use public Vite environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your Supabase project settings.');
}

// Create Supabase client with proper error handling
let supabase;

try {
  if (supabaseUrl && supabaseAnonKey) {
    // Create the client with the provided credentials
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    console.log('Supabase client initialized successfully');
  } else {
    // For development only - create a mock client that won't cause runtime errors
    // but will clearly indicate it's not connected to a real Supabase instance
    console.warn('Using mock Supabase client. Authentication and database features will not work.');
    
    // Creating a mock client with placeholder methods to prevent runtime errors
    supabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => ({ error: new Error('Mock Supabase: Please provide valid credentials') }),
        signInWithPassword: async () => ({ error: new Error('Mock Supabase: Please provide valid credentials') }),
        signOut: async () => ({ error: null })
      }
    };
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Provide a fallback mock client
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: async () => ({ error: new Error('Supabase initialization failed') }),
      signInWithPassword: async () => ({ error: new Error('Supabase initialization failed') }),
      signOut: async () => ({ error: null })
    }
  };
}

// Export the client
export { supabase };
