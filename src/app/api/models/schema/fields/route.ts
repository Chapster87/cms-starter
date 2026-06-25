import { exec } from "child_process"
import { NextRequest, NextResponse } from "next/server"
import { promisify } from "util"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase-server"
import { getFieldDefinition } from "@/utils/field-types"

const execPromise = promisify(exec)

/**
 * Triggers the type synchronization script.
 */
async function triggerTypeSync() {
  try {
    await execPromise("pnpm sync-types")
  } catch (error) {
    console.error("Failed to trigger type sync:", error)
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Helper to get an authenticated Supabase client for API routes.
 */
async function getAuthenticatedSupabaseClient() {
  return await createClient()
}

/**
 * Handles POST requests to create a new field (column) for a model.
 */
export async function POST(req: NextRequest) {
  try {
    const authenticatedSupabase = await getAuthenticatedSupabaseClient()
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
      settings,
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

    // 4. Update metadata manually after creation since RPC doesn't support all CMS fields yet
    const updatePayload: Record<string, unknown> = {}
    if (ui_order !== undefined) updatePayload.ui_order = ui_order
    if (settings !== undefined) updatePayload.settings = settings

    if (Object.keys(updatePayload).length > 0) {
      const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)
      await systemClient
        .from("fields")
        .update(updatePayload)
        .eq("model_id", model_id)
        .eq("field_name", sanitizedFieldName)
    }

    // Trigger type sync in the background
    triggerTypeSync()

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
    const authenticatedSupabase = await getAuthenticatedSupabaseClient()
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
    const { id, field_label, field_note, is_required, is_unique, settings } =
      body

    if (!id) {
      return NextResponse.json(
        { error: "Field ID is required." },
        { status: 400 }
      )
    }

    // Use system client to update metadata in public.fields
    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await systemClient
      .from("fields")
      .update({
        field_label,
        field_note,
        is_required: !!is_required,
        is_unique: !!is_unique,
        settings: settings || {},
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

    // Trigger type sync in the background
    triggerTypeSync()

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
    const authenticatedSupabase = await getAuthenticatedSupabaseClient()
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
    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)
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

    // Trigger type sync in the background
    triggerTypeSync()

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
    const authenticatedSupabase = await getAuthenticatedSupabaseClient()
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
    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

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
