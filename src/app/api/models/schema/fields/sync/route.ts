import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase-server"

/**
 * Helper to get an authenticated Supabase client for API routes.
 */
async function getAuthenticatedSupabaseClient() {
  return await createClient()
}

/**
 * Handles POST requests to sync unregistered physical columns into the CMS registry.
 */
export async function POST(req: NextRequest) {
  try {
    const authenticatedSupabase = await getAuthenticatedSupabaseClient()
    const { model_id, table_name } = await req.json()

    if (!model_id || !table_name) {
      return NextResponse.json(
        { error: "model_id and table_name are required." },
        { status: 400 }
      )
    }

    // 1. Get physical columns
    const { data: physicalColumns, error: fetchError } =
      await authenticatedSupabase.rpc("get_table_columns", {
        t_name: table_name,
      })

    if (fetchError) throw fetchError

    // 2. Get existing registered fields
    const { data: registeredFields, error: regError } =
      await authenticatedSupabase
        .from("fields")
        .select("field_name")
        .eq("model_id", model_id)

    if (regError) throw regError

    const registeredNames = new Set(registeredFields.map((f) => f.field_name))

    // 3. Identify unregistered columns (excluding system fields)
    const systemFields = ["id", "created_at", "updated_at"]
    const missingColumns = physicalColumns.filter(
      (col: { column_name: string }) =>
        !registeredNames.has(col.column_name) &&
        !systemFields.includes(col.column_name)
    )

    if (missingColumns.length === 0) {
      return NextResponse.json({ message: "Everything is in sync." })
    }

    // 4. Map and Register
    const newFields = missingColumns.map(
      (col: {
        column_name: string
        data_type: string
        is_nullable: string
      }) => {
        // Basic type mapping
        let fieldType = "text_single"
        if (col.data_type === "boolean") fieldType = "boolean"
        if (col.data_type === "integer" || col.data_type === "numeric")
          fieldType = "number"
        if (col.data_type === "timestamp with time zone")
          fieldType = "date_time"
        if (col.data_type === "jsonb") fieldType = "json"

        return {
          model_id,
          field_name: col.column_name,
          field_label: col.column_name
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase()),
          field_type: fieldType,
          is_required: col.is_nullable === "NO",
        }
      }
    )

    const { error: insertError } = await authenticatedSupabase
      .from("fields")
      .insert(newFields)

    if (insertError) throw insertError

    return NextResponse.json({
      message: `Successfully synced ${newFields.length} fields.`,
      synced_count: newFields.length,
    })
  } catch (err: unknown) {
    console.error(
      "Unexpected error in POST /api/models/schema/fields/sync:",
      err
    )
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
