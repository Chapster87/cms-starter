import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase-server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getAuthenticatedSupabaseClient() {
  return await createClient()
}

/**
 * POST /api/models/reorder
 * Bulk updates display_order and group_id for models and groups.
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

    const { items } = await req.json()

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      )
    }

    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    interface ReorderItem {
      id: string
      type: "model" | "group"
      display_order: number
      group_id?: string | null
    }

    // Perform updates in parallel
    const updates = items.map(async (item: ReorderItem) => {
      if (item.type === "model") {
        return systemClient
          .from("models")
          .update({
            display_order: item.display_order,
            group_id: item.group_id || null,
          })
          .eq("id", item.id)
      } else if (item.type === "group") {
        return systemClient
          .from("model_groups")
          .update({
            display_order: item.display_order,
          })
          .eq("id", item.id)
      }
    })

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r && "error" in r && r.error)

    if (errors.length > 0) {
      console.error("Reorder errors:", errors)
      return NextResponse.json(
        { error: "Some updates failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Reordered successfully" })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}
