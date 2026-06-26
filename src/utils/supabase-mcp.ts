import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a service-role Supabase client for use in the MCP server.
 * This bypasses RLS and uses native fetch/WebSockets in Node 22+.
 */
export function createMCPClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}
