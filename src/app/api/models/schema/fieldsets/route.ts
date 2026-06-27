import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/utils/supabase-server"
import { hasPermission } from "@/utils/permissions"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getAuthenticatedSupabaseClient() {
  return await createServerClient()
}

/**
 * GET: List all fieldsets for a model.
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

    const { searchParams } = new URL(req.url)
    const modelId = searchParams.get("model_id")

    if (!modelId) {
      return NextResponse.json(
        { error: "model_id is required" },
        { status: 400 }
      )
    }

    const systemClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await systemClient
      .from("fieldsets")
      .select("*")
      .eq("model_id", modelId)
      .order("ui_order", { ascending: true })

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * POST: Create a new fieldset.
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

    const { model_id, label, settings } = await req.json()

    if (!model_id || !label) {
      return NextResponse.json(
        { error: "model_id and label are required" },
        { status: 400 }
      )
    }

    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get max ui_order
    const { data: maxOrderData } = await systemClient
      .from("fieldsets")
      .select("ui_order")
      .eq("model_id", model_id)
      .order("ui_order", { ascending: false })
      .limit(1)

    const nextOrder = maxOrderData?.[0]
      ? (maxOrderData[0].ui_order || 0) + 1
      : 0

    const { data, error } = await systemClient
      .from("fieldsets")
      .insert([
        {
          model_id,
          label,
          settings: settings || {},
          ui_order: nextOrder,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * PATCH: Update a fieldset.
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

    const { id, label, settings, ui_order } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const updatePayload: {
      label?: string
      settings?: Record<string, unknown>
      ui_order?: number
    } = {}
    if (label !== undefined) updatePayload.label = label
    if (settings !== undefined) updatePayload.settings = settings
    if (ui_order !== undefined) updatePayload.ui_order = ui_order

    const systemClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await systemClient
      .from("fieldsets")
      .update(updatePayload)
      .eq("id", id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * DELETE: Remove a fieldset.
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
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const systemClient = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await systemClient.from("fieldsets").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
