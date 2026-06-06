import { createBrowserClient } from "@supabase/ssr"

/**
 * Creates a Supabase client for use in Client Components.
 * This client uses the browser's cookie storage.
 * @returns {ReturnType<typeof createBrowserClient>} The browser-side Supabase client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
