/**
 * Bangla Haat — Supabase Client Configuration
 *
 * Security Note:
 * The Supabase 'anon' key is designed to be public and used directly in browser environments.
 * Data protection and authorization MUST be enforced via PostgreSQL Row Level Security (RLS)
 * policies inside your Supabase dashboard.
 *
 * NEVER commit the 'service_role' secret key to GitHub or frontend code.
 */

(() => {
  try {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.info('Supabase library not loaded. Running in local storage mode.');
      window.banglaHaatSupabase = null;
      return;
    }

    // Default configuration (supports optional runtime override via window.BANGLA_HAAT_CONFIG)
    const config = window.BANGLA_HAAT_CONFIG || {
      url: 'https://lktkoucvjklqoswqngtu.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdGtvdWN2amtscW9zd3FuZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODU5ODYsImV4cCI6MjA3MDI2MTk4Nn0.VgbHMwg_hC6CV0C8Mu_abRZ3NvABzsz7bA6QmKnhYgA'
    };

    if (config.url && config.anonKey) {
      window.banglaHaatSupabase = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } else {
      window.banglaHaatSupabase = null;
    }
  } catch (err) {
    console.warn('Supabase client initialization skipped:', err.message);
    window.banglaHaatSupabase = null;
  }
})();
