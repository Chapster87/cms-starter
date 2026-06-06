import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

/**
 * Handles the Supabase OAuth callback.
 * This route is responsible for exchanging the authorization code for a session.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    // Create a Supabase client configured to use cookies
    const supabase = await createClient()

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + "/")
}
