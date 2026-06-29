import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

/**
 * GET /api/blocks/fields?blockId={blockId}
 * Fetches all fields for a given block.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const blockId = searchParams.get("blockId")

  if (!blockId) {
    return NextResponse.json({ error: "Block ID is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("fields")
    .select("*")
    .eq("block_id", blockId)
    .order("ui_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
