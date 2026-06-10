import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * API route for listing records from specific models for browsing.
 */
export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("Authorization")
    const accessToken = authorization?.split(" ")[1]

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { models: allowedModelIds } = body

    if (
      !allowedModelIds ||
      !Array.isArray(allowedModelIds) ||
      allowedModelIds.length === 0
    ) {
      return NextResponse.json([], { status: 200 })
    }

    const systemClient = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch model metadata
    const { data: allModels, error: modelsError } = await systemClient
      .from("models")
      .select("id, table_name, friendly_name, has_draft_mode")

    if (modelsError || !allModels) {
      console.error("List API: Error fetching models registry:", modelsError)
      return NextResponse.json(
        { error: "Failed to fetch model metadata" },
        { status: 500 }
      )
    }

    const modelsData = allModels.filter(
      (m) =>
        allowedModelIds.includes(m.id) || allowedModelIds.includes(m.table_name)
    )

    if (modelsData.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    // 2. Fetch records from all allowed models
    const listResults = await Promise.all(
      modelsData.map(async (model) => {
        const tableName = model.table_name
        const friendlyName = model.friendly_name
        const modelId = model.id
        const hasDraftMode = model.has_draft_mode

        const { data: columns, error: colError } = await systemClient.rpc(
          "get_table_columns",
          { t_name: tableName }
        )

        if (colError) {
          console.error(`Error fetching columns for ${tableName}:`, colError)
          return []
        }

        const typedColumns =
          (columns as Array<{ column_name: string; data_type: string }>) || []
        const columnNames = typedColumns.map((c) => c.column_name)

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

        // Fallback
        if (!displayColumn) {
          const firstTextColumn = typedColumns.find(
            (c) =>
              (c.data_type.includes("text") || c.data_type.includes("char")) &&
              !["id", "slug", "created_at", "updated_at"].includes(
                c.column_name
              )
          )
          displayColumn = firstTextColumn?.column_name || "id"
        }

        // Choose best subtitle field (slug or handle)
        let subtitleColumn: string | null = null
        if (columnNames.includes("slug")) subtitleColumn = "slug"
        else if (columnNames.includes("handle")) subtitleColumn = "handle"

        const selectFields = ["id", displayColumn]
        if (subtitleColumn && subtitleColumn !== displayColumn)
          selectFields.push(subtitleColumn)
        if (hasDraftMode) {
          selectFields.push("status")
          selectFields.push("_draft")
        }

        const { data, error } = await systemClient
          .from(tableName)
          .select(selectFields.join(","))
          .limit(100)

        if (error) {
          console.error(`Error listing table ${tableName}:`, error)
          return []
        }

        const records =
          (data as unknown as Array<Record<string, unknown>>) || []
        return records.map((record) => ({
          id: record.id as string,
          display_name:
            (record[displayColumn!] as string) || (record.id as string),
          subtitle: subtitleColumn
            ? (record[subtitleColumn] as string)
            : undefined,
          model_name: friendlyName,
          model_id: modelId,
          status: hasDraftMode ? (record.status as string) : undefined,
          has_draft: hasDraftMode ? record._draft !== null : false,
        }))
      })
    )

    const flattenedResults = listResults.flat()
    return NextResponse.json(flattenedResults)
  } catch (err: unknown) {
    console.error("List API Error:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
