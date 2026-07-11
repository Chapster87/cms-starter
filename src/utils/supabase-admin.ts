import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client with the service role key.
 * This client bypasses RLS and should only be used on the server or in tests.
 */
export const createAdminClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
