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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === "your-service-role-key") {
    return null; // Gracefully fallback when live env credentials are not yet supplied
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

