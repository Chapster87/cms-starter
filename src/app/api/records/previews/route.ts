import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { deeplyResolveMedia } from "@/utils/media-helpers"

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

    // 1. Separate registered models from virtual/system models
    const requestedModelIds = Array.isArray(allowedModels) ? allowedModels : []
    const isUsersRequested =
      requestedModelIds.includes("users") ||
      requestedModelIds.includes("public.users")

    // 2. Fetch metadata for registered models only
    const registeredModelIds = requestedModelIds.filter((id) => id !== "users")

    interface ModelMetadata {
      id: string
      table_name: string
      friendly_name: string
      has_draft_mode: boolean
      preview_columns?: string[] | null
      list_columns?: string[] | null
      subtitle_column?: string | null
    }
    let modelsData: ModelMetadata[] = []

    if (registeredModelIds.length > 0 || requestedModelIds.length === 0) {
      let modelsQuery = systemClient.from("models").select("*")

      if (registeredModelIds.length > 0) {
        modelsQuery = modelsQuery.in("id", registeredModelIds)
      }

      const { data: fetchedModels, error: modelsError } = await modelsQuery
      if (modelsError) {
        console.error("Previews API: Error fetching models:", modelsError)
      } else if (fetchedModels) {
        modelsData = fetchedModels
      }
    }

    // 3. Inject virtual "users" model if requested
    if (isUsersRequested) {
      modelsData.push({
        id: "users",
        table_name: "users",
        friendly_name: "CMS User",
        has_draft_mode: false,
        preview_columns: [],
      })
    }

    if (modelsData.length === 0) {
      return NextResponse.json([])
    }

    // Iterate through models to find the records
    const previewResults = await Promise.all(
      modelsData.map(async (model) => {
        let displayColumn = "id"
        const subtitleColumn = model.subtitle_column || null
        const selectFields = ["id"]

        if (model.table_name === "users") {
          displayColumn = "display_name"
          selectFields.push("display_name", "email")
        } else {
          // Find suitable columns
          const { data: columns } = await systemClient.rpc(
            "get_table_columns",
            {
              t_name: model.table_name,
            }
          )

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
            "short_name",
          ]

          displayColumn =
            displayCandidates.find((c) => columnNames.includes(c)) || "id"

          // Fallback
          if (displayColumn === "id") {
            const firstTextColumn = columnList.find(
              (c) =>
                (c.data_type.includes("text") ||
                  c.data_type.includes("char")) &&
                !["id", "slug", "created_at", "updated_at"].includes(
                  c.column_name
                )
            )
            displayColumn = firstTextColumn?.column_name || "id"
          }

          selectFields.push(displayColumn)
          if (subtitleColumn && subtitleColumn !== displayColumn)
            selectFields.push(subtitleColumn)
        }

        if (model.has_draft_mode) {
          selectFields.push("status")
          selectFields.push("_draft")
        }

        // Fetch all columns to ensure we have the full record data
        const { data, error } = await systemClient
          .from(model.table_name)
          .select("*")
          .in("id", ids)

        if (error) {
          return []
        }

        const records =
          (data as unknown as Array<Record<string, unknown>>) || []

        const resolvedRecords = await Promise.all(
          records.map(async (record) => {
            const resolvedData = await deeplyResolveMedia(record)

            // Smarter display name discovery if the discovered column is still a UUID or missing
            let discoveredName = record[displayColumn!] as string | undefined
            if (
              !discoveredName ||
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                String(discoveredName)
              )
            ) {
              // Try fallback candidates manually
              const fallback = [
                "name",
                "title",
                "label",
                "friendly_name",
                "short_name",
                "year",
              ].find((c) => record[c])
              if (fallback) discoveredName = record[fallback] as string
            }

            return {
              id: record.id as string,
              display_name: discoveredName || (record.id as string),
              subtitle: subtitleColumn
                ? (record[subtitleColumn] as string)
                : undefined,
              model_name: model.friendly_name,
              model_id: model.id,
              status: model.has_draft_mode
                ? (record.status as string)
                : undefined,
              has_draft: model.has_draft_mode ? record._draft !== null : false,
              raw_data: resolvedData,
              preview_columns: model.preview_columns || [],
              list_columns: model.list_columns || [],
            }
          })
        )

        return resolvedRecords
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
