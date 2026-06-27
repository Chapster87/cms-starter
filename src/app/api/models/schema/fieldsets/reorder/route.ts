import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/utils/supabase-server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const authenticatedSupabase = await createServerClient()
    const {
      data: { user },
    } = await authenticatedSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orders } = await req.json()

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    for (const item of orders) {
      await systemClient
        .from("fieldsets")
        .update({ ui_order: item.ui_order })
        .eq("id", item.id)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
