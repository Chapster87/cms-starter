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
      return supabase
    }

    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken,
    })
    return supabase
  }
  return supabase
}

/**
 * Handles GET requests to fetch the schema (columns) for a specific table.
 * @param {NextRequest} req - The incoming request.
 * @returns {NextResponse} A JSON response containing the column definitions.
 */
export async function GET(req: NextRequest) {
  try {
    const authenticatedSupabase = await getAuthenticatedSupabaseClient(req)
    const {
      data: { user },
    } = await authenticatedSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: User not authenticated." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const table = searchParams.get("table")

    if (!table) {
      return NextResponse.json(
        { error: "Table name is required." },
        { status: 400 }
      )
    }

    // Sanitize table name
    const sanitizedTable = table.replace(/[^a-zA-Z0-9_]/g, "")

    // Use system client for schema lookup to ensure we can read information_schema
    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    // Use Supabase RPC to get column information
    const { data, error } = await systemClient.rpc("get_table_columns", {
      t_name: sanitizedTable,
    })

    console.log(`Schema for '${sanitizedTable}':`, data)

    if (error) {
      console.error(`Error fetching schema for '${sanitizedTable}':`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: unknown) {
    console.error("Unexpected error in GET /api/models/schema:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
