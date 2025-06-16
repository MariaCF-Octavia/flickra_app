import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env file");
}

// Create client instance with enhanced configuration
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true, // Changed from false
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        // Try localStorage first, then sessionStorage as fallback
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
    heartbeatIntervalMs: 10000 // Keep connection alive
  }
});

// Enhanced logout method with proper cleanup
export const handleLogout = async () => {
  try {
    // Clear all Supabase-related items from storage
    const storageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || 
      key.startsWith('supabase.auth.')
    );
    
    storageKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    // Redirect to login page with full reload
    window.location.href = '/login';
    
    return error;
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = '/login'; // Force logout anyway
    return err;
  }
};

// Export both default and named exports
export default supabase;
export { supabase };