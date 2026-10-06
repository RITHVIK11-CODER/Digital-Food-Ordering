import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * Server-only Supabase Admin client with Service Role.
 * NEVER import or execute in client-side code!
 */
export function getAdminSupabaseClient(): SupabaseClient | null {
  if (typeof window !== "undefined" && !process.env.VITEST) {
    throw new Error("CRITICAL SECURITY VIOLATION: getAdminSupabaseClient invoked on client browser!");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith("your")
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !key || key.startsWith("your")) {
    return null; // Gracefully fallback when live env credentials are not yet supplied
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

