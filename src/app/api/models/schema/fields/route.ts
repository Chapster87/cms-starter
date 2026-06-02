import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabase } from "@/utils/supabaseClient"
import { getFieldDefinition } from "@/utils/field-types"

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
 * Handles POST requests to create a new field (column) for a model.
 */
export async function POST(req: NextRequest) {
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

    const {
      model_id,
      field_name,
      field_label,
      field_type,
      is_required,
      is_unique,
      ui_order,
    } = await req.json()

    // 1. Validation
    if (!model_id || !field_name || !field_label || !field_type) {
      return NextResponse.json(
        { error: "Missing required field parameters." },
        { status: 400 }
      )
    }

    // Sanitize field name to snake_case and prevent SQL injection
    const sanitizedFieldName = field_name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase()

    // 2. Resolve DB type from field definitions
    const definition = getFieldDefinition(field_type)
    if (!definition) {
      return NextResponse.json(
        { error: `Invalid field type: ${field_type}` },
        { status: 400 }
      )
    }

    // 3. Atomic RPC call: Adds physical column and registers metadata
    const { error: rpcError } = await authenticatedSupabase.rpc(
      "create_model_field",
      {
        p_model_id: model_id,
        p_field_name: sanitizedFieldName,
        p_field_label: field_label,
        p_field_type: field_type,
        p_db_type: definition.dbType,
        p_is_required: !!is_required,
        p_is_unique: !!is_unique,
      }
    )

    if (rpcError) {
      console.error("Error creating field via RPC:", rpcError)
      // Check if it's likely a missing function error
      if (rpcError.code === "P0001" || rpcError.message.includes("not found")) {
        return NextResponse.json(
          {
            error:
              "Database foundation missing. Ensure create_model_field RPC exists.",
            details: rpcError.message,
          },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    // 4. Update the ui_order manually after creation since RPC doesn't support it yet
    if (ui_order !== undefined) {
      const systemClient = createClient(supabaseUrl, supabaseServiceKey)
      await systemClient
        .from("fields")
        .update({ ui_order })
        .eq("model_id", model_id)
        .eq("field_name", sanitizedFieldName)
    }

    return NextResponse.json(
      {
        message: `Field '${field_label}' created successfully.`,
        field_name: sanitizedFieldName,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error("Unexpected error in POST /api/models/schema/fields:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * Handles PATCH requests to update field metadata.
 */
export async function PATCH(req: NextRequest) {
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

    const body = await req.json()
    console.log("PATCH /api/models/schema/fields request body:", body)
    const { id, field_label, field_note, is_required, is_unique } = body

    if (!id) {
      return NextResponse.json(
        { error: "Field ID is required." },
        { status: 400 }
      )
    }

    // Use system client to update metadata in public.fields
    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await systemClient
      .from("fields")
      .update({
        field_label,
        field_note,
        is_required: !!is_required,
        is_unique: !!is_unique,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating field metadata:", error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: unknown) {
    console.error("Unexpected error in PATCH /api/models/schema/fields:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * Handles DELETE requests to remove a field.
 */
export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Field ID is required." },
        { status: 400 }
      )
    }

    // Call RPC to safely drop column and metadata
    // We use the system client here because authenticatedSupabase might not have
    // permission to execute RPCs that modify schema depending on DB setup.
    const systemClient = createClient(supabaseUrl, supabaseServiceKey)
    const { error: rpcError } = await systemClient.rpc("drop_model_field", {
      p_field_id: id,
    })

    if (rpcError) {
      console.error("Error dropping field via RPC:", rpcError)
      return NextResponse.json(
        { error: rpcError.message, details: rpcError },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Field deleted successfully." })
  } catch (err: unknown) {
    console.error("Unexpected error in DELETE /api/models/schema/fields:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * Handles GET requests to list fields for a specific model.
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

    // Create a system client to bypass RLS on metadata tables
    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    const { searchParams } = new URL(req.url)
    const model_id = searchParams.get("model_id")
    const table_name = searchParams.get("table")

    if (!model_id && !table_name) {
      return NextResponse.json(
        { error: "model_id or table name is required." },
        { status: 400 }
      )
    }

    let finalModelId = model_id

    // If table name is provided, resolve the ID first using system client
    if (table_name && !finalModelId) {
      const { data: modelData } = await systemClient
        .from("models")
        .select("id")
        .eq("table_name", table_name)
        .single()

      if (modelData) {
        finalModelId = modelData.id
      }
    }

    if (!finalModelId) {
      return NextResponse.json([], { status: 200 })
    }

    console.log(`Fetching fields for model_id: ${finalModelId}`)

    // Fetch from fields registry using system client to ensure we can see metadata
    const { data, error } = await systemClient
      .from("fields")
      .select("*")
      .eq("model_id", finalModelId)
      .order("ui_order", { ascending: true })

    if (error) {
      console.error("Error fetching fields:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: unknown) {
    console.error("Unexpected error in GET /api/models/schema/fields:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
