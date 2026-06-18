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
    const { models: allowedModelIds, filters, excludeIds } = body

    console.log("List API Request:", { allowedModelIds, filters, excludeIds })

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

    // Handle "users" as a virtual model if requested
    if (
      allowedModelIds.includes("users") &&
      !modelsData.find((m) => m.table_name === "users")
    ) {
      modelsData.push({
        id: "users",
        table_name: "users",
        friendly_name: "CMS User",
        has_draft_mode: false,
      })
    }

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

        let displayColumn = "id"
        let subtitleColumn: string | null = null
        const selectFields = ["id"]
        let typedColumns: Array<{ column_name: string; data_type: string }> = []

        if (tableName === "users") {
          displayColumn = "display_name"
          subtitleColumn = "email"
          selectFields.push("display_name", "email")
        } else {
          const { data: columns, error: colError } = await systemClient.rpc(
            "get_table_columns",
            { t_name: tableName }
          )

          if (colError) {
            console.error(`Error fetching columns for ${tableName}:`, colError)
            return []
          }

          typedColumns =
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

          displayColumn =
            displayCandidates.find((c) => columnNames.includes(c)) || "id"

          // Fallback
          if (displayColumn === "id") {
            const firstTextColumn = typedColumns.find(
              (c) =>
                (c.data_type.includes("text") ||
                  c.data_type.includes("char")) &&
                !["id", "slug", "created_at", "updated_at"].includes(
                  c.column_name
                )
            )
            displayColumn = firstTextColumn?.column_name || "id"
          }

          // Choose best subtitle field (slug or handle)
          if (columnNames.includes("slug")) subtitleColumn = "slug"
          else if (columnNames.includes("handle")) subtitleColumn = "handle"

          selectFields.push(displayColumn)

          if (subtitleColumn && subtitleColumn !== displayColumn) {
            selectFields.push(subtitleColumn)
          }
        }
        if (hasDraftMode) {
          selectFields.push("status")
          selectFields.push("_draft")
        }

        let query = systemClient.from(tableName).select(selectFields.join(","))

        if (excludeIds && Array.isArray(excludeIds) && excludeIds.length > 0) {
          query = query.not("id", "in", `(${excludeIds.join(",")})`)
        }

        if (filters) {
          // Check for filters keyed by model UUID, physical table name, or friendly name
          const modelFilters =
            filters[modelId] || filters[tableName] || filters[friendlyName]
          if (modelFilters) {
            Object.entries(modelFilters).forEach(([col, val]) => {
              if (val !== undefined && val !== null && val !== "") {
                const colInfo = typedColumns?.find((c) => c.column_name === col)
                const isJson = colInfo?.data_type === "jsonb"

                // Handle various array scenarios (e.g. [uuid], or just uuid)
                const rawVal = Array.isArray(val) ? val.flat() : [val]
                const cleanVals = rawVal.filter(
                  (v) => v !== null && v !== "" && v !== undefined
                )

                if (cleanVals.length > 0) {
                  const isUuid = colInfo?.data_type === "uuid"
                  const isText =
                    colInfo?.data_type?.includes("text") ||
                    colInfo?.data_type?.includes("char")

                  if (isJson || col === "league" || col === "divison") {
                    // We need to use PostgREST .cs. syntax directly in an .or() or similar
                    // if .contains() is still causing JSON syntax errors due to how
                    // Supabase JS maps arrays to JSONB for non-explicitly-jsonb columns.
                    // Let's try the direct OR filter with JSON strings.
                    const orParts = cleanVals.map((v) => {
                      const jsonV = JSON.stringify(v)
                      // This matches the ["uuid"] structure normalized in the DB
                      return `${col}.cs.[${jsonV}]`
                    })
                    query = query.or(orParts.join(","))
                  } else if (isUuid || isText) {
                    query = query.in(col, cleanVals)
                  } else {
                    query = query.in(col, cleanVals)
                  }
                }
              }
            })
          }
        }

        const { data, error } = await query.limit(100)

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
