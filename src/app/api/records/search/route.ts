import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * API route for searching records across multiple models.
 * Primarily used by the ReferenceField component.
 */
export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("Authorization")
    const accessToken = authorization?.split(" ")[1]

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { query, models: allowedModelIds } = await req.json()

    if (!query || !allowedModelIds || !Array.isArray(allowedModelIds)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch model metadata for the allowed IDs
    const { data: modelsData, error: modelsError } = await systemClient
      .from("models")
      .select("id, table_name, friendly_name")
      .in("id", allowedModelIds)

    if (modelsError || !modelsData) {
      return NextResponse.json(
        { error: "Failed to fetch model metadata" },
        { status: 500 }
      )
    }

    // 2. Perform search across each model's table
    const searchResults = await Promise.all(
      modelsData.map(async (model) => {
        // Find a suitable column to search in
        const { data: columns } = await systemClient.rpc("get_table_columns", {
          t_name: model.table_name,
        })

        const columnList =
          (columns as Array<{ column_name: string; data_type: string }>) || []
        const columnNames = columnList.map((c) => c.column_name)

        const displayCandidates = [
          "name",
          "title",
          "label",
          "friendly_name",
          "display_name",
          "full_name",
          "heading",
          "text",
          "slug",
          "year",
          "season_name",
          "team_name",
        ]

        let searchColumn = displayCandidates.find((c) =>
          columnNames.includes(c)
        )

        // Fallback
        if (!searchColumn) {
          const firstTextColumn = columnList.find(
            (c) =>
              (c.data_type.includes("text") || c.data_type.includes("char")) &&
              !["id", "slug", "created_at", "updated_at"].includes(
                c.column_name
              )
          )
          searchColumn = firstTextColumn?.column_name || "id"
        }

        const { data, error } = await systemClient
          .from(model.table_name)
          .select(`id, ${searchColumn}`)
          .ilike(searchColumn, `%${query}%`)
          .limit(10)

        if (error) {
          console.error(`Error searching table ${model.table_name}:`, error)
          return []
        }

        const records =
          (data as unknown as Array<Record<string, unknown>>) || []
        return records.map((record) => ({
          id: record.id as string,
          display_name:
            (record[searchColumn!] as string) || (record.id as string),
          model_name: model.friendly_name,
          model_id: model.id,
        }))
      })
    )

    const flattenedResults = searchResults.flat()
    return NextResponse.json(flattenedResults)
  } catch (err: unknown) {
    console.error("Search API Error:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
