import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables. VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required.');
}

// Create a proxy client if credentials are missing to prevent fatal startup crashes,
// but still throw descriptive errors when the client is actually used.
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : new Proxy({} as SupabaseClient, {
      get: (_target, prop) => {
        if (prop === 'auth') {
          return new Proxy({}, {
            get: (_authTarget, authProp) => {
              if (authProp === 'getSession') {
                return async () => ({ data: { session: null }, error: null });
              }
              if (authProp === 'onAuthStateChange') {
                return () => ({ data: { subscription: { unsubscribe: () => {} } } });
              }
              return async () => {
                return { error: { message: 'Configuration Error: VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY are missing.' } };
              };
            }
          });
        }
        return () => {
          throw new Error(`Supabase configuration missing (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY). Cannot access ${String(prop)}.`);
        };
      }
    });
