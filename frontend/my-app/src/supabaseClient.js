import { createClient } from "@supabase/supabase-js";

// VITE ENVIRONMENT VARIABLES
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // Fixed variable name

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`
    Missing Supabase credentials. Please check:
    1. Your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
    2. You've restarted the dev server after adding them
    3. The values match your Supabase project settings
  `);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        const item = localStorage.getItem(key);
        if (!item) {
          return sessionStorage.getItem(key);
        }
        return item;
      },
      setItem: (key, value) => {
        localStorage.setItem(key, value);
        sessionStorage.setItem(key, value);
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }
    }
  },
  realtime: {
    heartbeatIntervalMs: 10000
  }
});

export const handleLogout = async () => {
  try {
    const storageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || 
      key.startsWith('supabase.auth.')
    );
    
    storageKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    const { error } = await supabase.auth.signOut();
    window.location.href = '/login';
    return error;
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = '/login';
    return err;
  }
};

export default supabase;
export { supabase };