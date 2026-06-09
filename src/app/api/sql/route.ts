import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

/**
 * Handles POST requests to execute arbitrary SQL via RPC.
 * This is used for schema migrations and direct table manipulation.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: User not authenticated." },
        { status: 401 }
      )
    }

    const { sql } = await req.json()

    if (!sql) {
      return NextResponse.json(
        { error: "SQL statement is required." },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err: unknown) {
    console.error("Unexpected error in POST /api/sql:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
