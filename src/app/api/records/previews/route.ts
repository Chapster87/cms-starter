import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * API route for fetching previews for specific record IDs.
 */
export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("Authorization")
    const accessToken = authorization?.split(" ")[1]

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ids } = await req.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json([])
    }

    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all models to know which tables to check
    const { data: modelsData, error: modelsError } = await systemClient
      .from("models")
      .select("id, table_name, friendly_name")

    if (modelsError || !modelsData) {
      return NextResponse.json(
        { error: "Failed to fetch model metadata" },
        { status: 500 }
      )
    }

    // Iterate through models to find the records
    // In a optimized version, we might store model_id alongside the reference
    const previewResults = await Promise.all(
      modelsData.map(async (model) => {
        // Find suitable columns
        const { data: columns } = await systemClient.rpc("get_table_columns", {
          t_name: model.table_name,
        })

        const columnList = (columns as Array<{ column_name: string }>) || []
        let displayColumn = "name"
        const hasTitle = columnList.some((c) => c.column_name === "title")
        if (hasTitle) displayColumn = "title"

        const hasSlug = columnList.some((c) => c.column_name === "slug")
        const selectFields = [`id`, `${displayColumn}`]
        if (hasSlug) selectFields.push("slug")

        const { data, error } = await systemClient
          .from(model.table_name)
          .select(selectFields.join(", "))
          .in("id", ids)

        if (error) {
          return []
        }

        const records =
          (data as unknown as Array<Record<string, unknown>>) || []
        return records.map((record) => ({
          id: record.id as string,
          display_name:
            (record[displayColumn] as string) || (record.id as string),
          subtitle: record.slug as string | undefined,
          model_name: model.friendly_name,
          model_id: model.id,
        }))
      })
    )

    const flattenedResults = previewResults.flat()

    return NextResponse.json(flattenedResults)
  } catch (err: unknown) {
    console.error("Previews API Error:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
