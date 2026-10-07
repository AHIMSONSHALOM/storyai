/**
 * StoryForge AI - Supabase Client Initialization
 */

(function () {
  // Read environment variables injected into window by Flask templates
  const supabaseUrl = window.SUPABASE_URL || "";
  const supabaseAnonKey = window.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project-id")) {
    console.warn("[STORYFORGE SETUP WARNING] Supabase URL or Anon Key is missing or default template placeholder. Please update your .env file.");
  }

  if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log("[STORYFORGE] Supabase JS Client initialized successfully.");
  } else {
    console.error("[STORYFORGE ERROR] Supabase JS SDK not loaded from CDN.");
  }
})();
