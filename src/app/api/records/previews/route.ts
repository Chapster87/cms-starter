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

    const { ids, allowedModels } = await req.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json([])
    }

    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch models to check. Filter by allowedModels if provided to improve performance.
    let modelsQuery = systemClient
      .from("models")
      .select("id, table_name, friendly_name")

    if (
      allowedModels &&
      Array.isArray(allowedModels) &&
      allowedModels.length > 0
    ) {
      modelsQuery = modelsQuery.in("id", allowedModels)
    }

    const { data: modelsData, error: modelsError } = await modelsQuery

    if (modelsError || !modelsData) {
      return NextResponse.json(
        { error: "Failed to fetch model metadata" },
        { status: 500 }
      )
    }

    // Iterate through models to find the records
    const previewResults = await Promise.all(
      modelsData.map(async (model) => {
        // Find suitable columns
        const { data: columns } = await systemClient.rpc("get_table_columns", {
          t_name: model.table_name,
        })

        const columnList =
          (columns as Array<{ column_name: string; data_type: string }>) || []
        const columnNames = columnList.map((c) => c.column_name)

        // Choose best display field
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

        let displayColumn = displayCandidates.find((c) =>
          columnNames.includes(c)
        )

        // Fallback: If no candidate found, pick the first text/varchar column that isn't id/slug
        if (!displayColumn) {
          const firstTextColumn = columnList.find(
            (c) =>
              (c.data_type.includes("text") || c.data_type.includes("char")) &&
              !["id", "slug", "created_at", "updated_at"].includes(
                c.column_name
              )
          )
          displayColumn = firstTextColumn?.column_name || "id"
        }

        const hasSlug = columnNames.includes("slug")
        const selectFields = [`id`, `${displayColumn}`]
        if (hasSlug && displayColumn !== "slug") selectFields.push("slug")

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
            (record[displayColumn!] as string) || (record.id as string),
          subtitle: record.slug as string | undefined,
          model_name: model.friendly_name,
          model_id: model.id,
        }))
      })
    )

    const flattenedResults = previewResults.flat()
    // Ensure unique results if multiple models returned the same ID (unlikely but possible)
    const uniqueResults = Array.from(
      new Map(flattenedResults.map((r) => [r.id, r])).values()
    )

    return NextResponse.json(uniqueResults)
  } catch (err: unknown) {
    console.error("Previews API Error:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
