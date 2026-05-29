import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabase } from "@/utils/supabaseClient"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Helper to get an authenticated Supabase client for API routes.
 */
async function getAuthenticatedSupabaseClient(req: NextRequest) {
  const authorization = req.headers.get("Authorization")
  const accessToken = authorization?.split(" ")[1]

  if (accessToken) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      console.error("Authentication error in API route:", error?.message)
      return null
    }

    return supabase
  }
  return null
}

/**
 * Handles POST requests to reorder fields for a model.
 * Expects an array of objects: [{ id: string, ui_order: number }]
 */
export async function POST(req: NextRequest) {
  try {
    const authenticatedSupabase = await getAuthenticatedSupabaseClient(req)
    if (!authenticatedSupabase) {
      return NextResponse.json(
        { error: "Unauthorized: User not authenticated." },
        { status: 401 }
      )
    }

    const { orders } = await req.json()

    if (!Array.isArray(orders)) {
      return NextResponse.json(
        { error: "Invalid payload: orders must be an array." },
        { status: 400 }
      )
    }

    // Create a system client to bypass RLS on metadata tables for updates
    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    // Perform updates in parallel
    // NOTE: In a high-traffic production app, an RPC for batch updates would be more efficient
    const updatePromises = orders.map(
      (item: { id: string; ui_order: number }) =>
        systemClient
          .from("fields")
          .update({ ui_order: item.ui_order })
          .eq("id", item.id)
    )

    const results = await Promise.all(updatePromises)
    const errors = results.filter((r) => r.error)

    if (errors.length > 0) {
      console.error("Errors during reorder update:", errors)
      return NextResponse.json(
        { error: "Some fields failed to update.", details: errors },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Fields reordered successfully." })
  } catch (err: unknown) {
    console.error(
      "Unexpected error in POST /api/models/schema/fields/reorder:",
      err
    )
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
