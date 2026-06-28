import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const systemClient = createClient(supabaseUrl, supabaseServiceKey)

interface ReferenceCache {
  [id: string]: {
    display_name: string
    model_name: string
  }
}

/**
 * Resolves reference IDs in a record into preview objects containing display names.
 * This helper uses the field registry to identify reference fields.
 */
export async function resolveRecordReferences(
  record: Record<string, unknown>,
  modelId: string
) {
  // 1. Fetch fields for this model to identify references
  const { data: fields } = await systemClient
    .from("fields")
    .select("*")
    .eq("model_id", modelId)
    .in("field_type", ["reference", "author"])

  if (!fields || fields.length === 0) return record

  const resolved = { ...record }
  const cache: ReferenceCache = {}

  for (const field of fields) {
    const fieldName = field.field_name
    const val =
      record[fieldName] ??
      record[`${fieldName}_id`] ??
      record[`${fieldName}_uuid`]
    if (!val) continue

    // Handle single UUID or array of UUIDs
    const ids = Array.isArray(val) ? val : [val]
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    const validIds = ids.filter(
      (id) => typeof id === "string" && uuidPattern.test(id)
    )
    if (validIds.length === 0) continue

    const resolvedValues = []

    for (const id of validIds) {
      if (cache[id]) {
        resolvedValues.push({ id, ...cache[id] })
        continue
      }

      // Try to find which model this ID belongs to by checking allowed_models in settings
      const settings = (field.settings as Record<string, unknown>) || {}
      const allowedModels = (settings.allowed_models as string[]) || []

      // We need to find the display name for this ID.
      // We'll use the record previews logic: find the best display column.
      const preview = await fetchRecordPreview(id, allowedModels)
      if (preview) {
        cache[id] = {
          display_name: preview.display_name,
          model_name: preview.model_name,
        }
        resolvedValues.push(preview)
      } else {
        resolvedValues.push(id)
      }
    }

    // Store resolved preview data in a separate _resolved property
    // This prevents overwriting the raw UUID values needed by the form
    if (!resolved._resolved) {
      resolved._resolved = {}
    }
    ;(resolved._resolved as Record<string, unknown>)[field.field_name] =
      Array.isArray(val) ? resolvedValues : resolvedValues[0]
  }

  return resolved
}

async function fetchRecordPreview(id: string, allowedModels: string[]) {
  // If we don't know the models, we can't easily find the record without scanning everything
  if (!allowedModels || allowedModels.length === 0) return null

  // Fetch model metadata for these allowed models
  const { data: models } = await systemClient
    .from("models")
    .select("*")
    .in("id", allowedModels)

  if (!models) return null

  for (const model of models) {
    // 1. Find best display column
    const { data: columns } = await systemClient.rpc("get_table_columns", {
      t_name: model.table_name,
    })
    const columnNames =
      (columns as Array<{ column_name: string }>)?.map((c) => c.column_name) ||
      []

    const displayCandidates = [
      "name",
      "title",
      "label",
      "friendly_name",
      "display_name",
      "team_name",
      "short_name",
      "slug",
    ]
    const displayColumn =
      displayCandidates.find((c) => columnNames.includes(c)) || "id"

    // 2. Fetch the record
    const { data: record } = (await systemClient
      .from(model.table_name)
      .select("*")
      .eq("id", id)
      .single()) as { data: Record<string, unknown> | null }

    if (record) {
      return {
        id: record.id as string,
        display_name:
          (record[displayColumn] as string) || (record.id as string),
        model_name: model.friendly_name,
      }
    }
  }

  return null
}
