import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase-server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Persists the UI order for blocks using the service role to bypass RLS for schema updates.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { items } = await req.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid items array" },
        { status: 400 }
      )
    }

    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    interface ReorderItem {
      id: string
      type: "block" | "group"
      display_order: number
      group_id?: string | null
    }

    const updates = items.map(async (item: ReorderItem) => {
      if (item.type === "block") {
        return systemClient
          .from("blocks")
          .update({
            display_order: item.display_order,
            group_id: item.group_id || null,
          })
          .eq("id", item.id)
      } else if (item.type === "group") {
        return systemClient
          .from("block_groups")
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

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("Block reorder error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}
