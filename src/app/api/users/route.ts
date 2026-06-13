import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase-server"
import { is_admin } from "@/utils/permissions"

/**
 * POST /api/users
 * Creates a new user in Supabase Auth and the public.users table.
 * Requires Admin privileges.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser || !is_admin(currentUser)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, password, role, status } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Use Service Role client for Admin operations
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Create Auth User
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. The trigger `on_auth_user_created` should automatically create the record in `public.users`.
    // However, we want to ensure the role and status are set correctly as requested in the form,
    // since the trigger might default them.

    const { error: updateError } = await adminClient
      .from("users")
      .update({ role, status })
      .eq("id", authData.user.id)

    if (updateError) {
      // If updating fails, we might want to log it, but the user is already created
      console.error("Error updating user profile:", updateError)
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error: unknown) {
    console.error("API Error:", error)
    const message =
      error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
