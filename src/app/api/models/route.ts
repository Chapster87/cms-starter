import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase-server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Helper to get an authenticated Supabase client for API routes.
 * Uses the standardized server client which handles cookies automatically.
 */
async function getAuthenticatedSupabaseClient() {
  return await createClient()
}

/**
 * Handles GET requests to list all models from the registry.
 * @returns {NextResponse} A JSON response containing the list of model objects.
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

    // Use system client for registry lookup to avoid RLS friction on metadata
    const systemClient = createSupabaseClient(supabaseUrl, supabaseServiceKey)

    // Fetch from our new models registry table
    const { data, error } = await systemClient
      .from("models")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching models from registry:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: unknown) {
    console.error("Unexpected error in GET /api/models:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * Handles POST requests to create a new model (Supabase table).
 * @param {NextRequest} req - The incoming request.
 * @returns {NextResponse} A JSON response indicating success or failure.
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

    const { name, friendly_name, is_singleton, emoji, group_id } =
      await req.json()

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Model name is required and must be a non-empty string." },
        { status: 400 }
      )
    }

    // Sanitize table name to prevent SQL injection
    const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, "")

    // 1. Create the physical Postgres table
    const { error: tableError } = await authenticatedSupabase.rpc(
      "create_table_with_uuid_and_timestamp",
      { table_name: sanitizedName }
    )

    if (tableError) {
      console.error(`Error creating table '${sanitizedName}':`, tableError)
      return NextResponse.json({ error: tableError.message }, { status: 500 })
    }

    // 2. Get the current max display order to append to the end
    const { data: maxOrderData } = await authenticatedSupabase
      .from("models")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)

    const nextOrder =
      maxOrderData && maxOrderData.length > 0
        ? (maxOrderData[0].display_order || 0) + 1
        : 0

    // 3. Register the table in our models registry
    // Ensure we are using the exact friendly_name passed from the request body
    const { error: registryError } = await authenticatedSupabase
      .from("models")
      .upsert([
        {
          table_name: sanitizedName,
          slug: sanitizedName,
          friendly_name: friendly_name, // Use original casing from request
          is_singleton: is_singleton || false,
          display_order: nextOrder,
          emoji: emoji || null,
          group_id: group_id || null,
        },
      ])
      .select()

    if (registryError) {
      console.error(
        `Error registering table '${sanitizedName}':`,
        registryError
      )
      // Note: Table exists but registry failed.
      return NextResponse.json(
        { error: registryError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: `Table '${sanitizedName}' created and registered successfully.`,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error("Unexpected error in POST /api/models:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * Handles PATCH requests to update an existing model's metadata.
 * @param {NextRequest} req - The incoming request.
 * @returns {NextResponse} A JSON response indicating success or failure.
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

    const { table_name, friendly_name, is_singleton, emoji, group_id } =
      await req.json()

    if (!table_name) {
      return NextResponse.json(
        { error: "Table name is required for update." },
        { status: 400 }
      )
    }

    const { error } = await authenticatedSupabase
      .from("models")
      .update({
        friendly_name,
        is_singleton,
        emoji: emoji || null,
        group_id: group_id || null,
      })
      .eq("table_name", table_name)

    if (error) {
      console.error(`Error updating model '${table_name}':`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: `Model '${table_name}' updated successfully.` },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error("Unexpected error in PATCH /api/models:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}

/**
 * Handles DELETE requests to delete a model (Supabase table).
 * The model name is expected as a query parameter.
 * @param {NextRequest} req - The incoming request.
 * @returns {NextResponse} A JSON response indicating success or failure.
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
    const name = searchParams.get("name")

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Model name is required for deletion." },
        { status: 400 }
      )
    }

    // Sanitize table name to prevent SQL injection
    const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, "")

    // 1. Remove from registry first
    // We use authenticatedSupabase to ensure RLS is respected if configured,
    // or fallback to checking why the delete might be failing.
    const { error: registryError } = await authenticatedSupabase
      .from("models")
      .delete()
      .eq("table_name", sanitizedName)

    if (registryError) {
      console.error(
        `Error removing from registry '${sanitizedName}':`,
        registryError
      )
      return NextResponse.json(
        { error: registryError.message },
        { status: 500 }
      )
    }

    // 2. Drop the physical table
    const { error: tableError } = await authenticatedSupabase.rpc(
      "drop_table",
      {
        table_name: sanitizedName,
      }
    )

    if (tableError) {
      console.error(`Error deleting table '${sanitizedName}':`, tableError)
      return NextResponse.json({ error: tableError.message }, { status: 500 })
    }

    // 3. Re-index display_order for remaining models
    const { data: remainingModels } = await authenticatedSupabase
      .from("models")
      .select("*")
      .order("display_order", { ascending: true })

    if (remainingModels) {
      for (let i = 0; i < remainingModels.length; i++) {
        await authenticatedSupabase
          .from("models")
          .upsert({ ...remainingModels[i], display_order: i })
          .select()
      }
    }

    return NextResponse.json(
      { message: `Table '${sanitizedName}' deleted successfully.` },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error("Unexpected error in DELETE /api/models:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
