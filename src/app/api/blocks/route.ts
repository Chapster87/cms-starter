import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

/**
 * GET /api/blocks
 * Fetches all blocks from the registry.
 */
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .order("label", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * POST /api/blocks
 * Creates a new block.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from("blocks")
    .insert([
      {
        label: body.label,
        api_id: body.api_id,
        emoji: body.emoji,
        description: body.description,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * PATCH /api/blocks
 * Updates an existing block.
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const body = await req.json()

  if (!id) {
    return NextResponse.json({ error: "Block ID is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("blocks")
    .update({
      label: body.label,
      api_id: body.api_id,
      emoji: body.emoji,
      description: body.description,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * DELETE /api/blocks
 * Deletes a block.
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Block ID is required" }, { status: 400 })
  }

  const { error } = await supabase.from("blocks").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
