import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase-server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getAuthenticatedSupabaseClient() {
  return await createClient()
}

/**
 * GET /api/models/groups
 * Lists all model groups.
 */
export async function GET(req: NextRequest) {
  try {
    const authenticatedSupabase = await getAuthenticatedSupabaseClient()
    const {
      data: { user },
    } = await authenticatedSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await systemClient
      .from("model_groups")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/models/groups
 * Creates a new model group.
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

    const { name, emoji, type } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    // Get max display order
    const { data: maxOrderData } = await systemClient
      .from("model_groups")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)

    const nextOrder = (maxOrderData?.[0]?.display_order ?? -1) + 1

    const { data, error } = await systemClient
      .from("model_groups")
      .insert([{ name, emoji, type: type || null, display_order: nextOrder }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/models/groups
 * Updates a model group.
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

    const { id, name, emoji, type } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await systemClient
      .from("model_groups")
      .update({ name, emoji, type })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/models/groups
 * Deletes a model group.
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

    // The foreign key constraint on public.models has ON DELETE SET NULL,
    // so deleting the group will orphan the models automatically.

    const { error } = await systemClient
      .from("model_groups")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Group deleted" })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}
