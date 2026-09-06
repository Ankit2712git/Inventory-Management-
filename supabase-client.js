/**
 * Bangla Haat — Supabase Client Configuration
 *
 * Security Architecture:
 * - Zero hardcoded API keys or credentials in GitHub repository files.
 * - Runtime configuration is loaded securely via window.BANGLA_HAAT_CONFIG
 *   populated dynamically by the backend server from environment variables.
 * - If Supabase credentials are not configured in the environment,
 *   the application runs in resilient offline / local storage mode.
 */

(() => {
  try {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.info('[Bangla Haat] Supabase library not loaded. Running in local storage mode.');
      window.banglaHaatSupabase = null;
      return;
    }

    // Configuration provided dynamically by server via window.BANGLA_HAAT_CONFIG
    const config = window.BANGLA_HAAT_CONFIG || {};

    if (config.url && config.anonKey) {
      window.banglaHaatSupabase = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      console.info('[Bangla Haat] Supabase live connection active.');
    } else {
      window.banglaHaatSupabase = null;
      console.info('[Bangla Haat] Operating in secure local storage mode.');
    }
  } catch (err) {
    console.warn('[Bangla Haat] Supabase initialization fallback to local storage:', err.message);
    window.banglaHaatSupabase = null;
  }
})();
