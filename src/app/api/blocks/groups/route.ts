import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase-server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getAuthenticatedSupabaseClient() {
  return await createClient()
}

/**
 * GET /api/blocks/groups
 * Fetch all block groups.
 */
export async function GET() {
  try {
    const supabase = await getAuthenticatedSupabaseClient()
    const { data, error } = await supabase
      .from("block_groups")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/blocks/groups
 * Create a new block group.
 */
export async function POST(req: NextRequest) {
  try {
    const authenticatedSupabase = await getAuthenticatedSupabaseClient()
    const {
      data: { user },
    } = await authenticatedSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, emoji } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    // Get max display order
    const { data: maxOrderData } = await systemClient
      .from("block_groups")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)

    const nextOrder = (maxOrderData?.[0]?.display_order ?? -1) + 1

    const { data, error } = await systemClient
      .from("block_groups")
      .insert([{ name, emoji: emoji || "📁", display_order: nextOrder }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/blocks/groups
 * Update an existing block group.
 */
export async function PATCH(req: NextRequest) {
  try {
    const authenticatedSupabase = await getAuthenticatedSupabaseClient()
    const {
      data: { user },
    } = await authenticatedSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, name, emoji, display_order } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await systemClient
      .from("block_groups")
      .update({ name, emoji, display_order })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/blocks/groups
 * Delete a block group.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authenticatedSupabase = await getAuthenticatedSupabaseClient()
    const {
      data: { user },
    } = await authenticatedSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    const { error } = await systemClient
      .from("block_groups")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Group deleted successfully" })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}
