import { createClient } from "@/utils/supabase"
import { CMSField } from "@/types/fields"

/**
 * Resolves reference IDs in a record into objects containing display names and model info.
 * This is the client-side equivalent of the server-side reference-resolution utility.
 */
export async function resolveReferences(
  record: Record<string, unknown>,
  fields: CMSField[]
): Promise<Record<string, unknown>> {
  const _supabase = createClient()
  const resolved = { ...record }

  // Filter for reference-type fields that have values (checking both field name and common DB column variations)
  const referenceFields = fields.filter((f) => {
    if (f.field_type !== "reference") return false
    const name = f.field_name
    return (
      record[name] !== undefined ||
      record[`${name}_id`] !== undefined ||
      record[`${name}_uuid`] !== undefined
    )
  })

  if (referenceFields.length === 0) return record

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  for (const field of referenceFields) {
    // Find the actual value in the record, checking variations
    const name = field.field_name
    const val = record[name] ?? record[`${name}_id`] ?? record[`${name}_uuid`]

    if (val === undefined || val === null) continue

    const ids = Array.isArray(val) ? val : [val]

    // Only process valid UUIDs
    const validIds = ids.filter(
      (id) => typeof id === "string" && uuidPattern.test(id)
    )
    if (validIds.length === 0) continue

    const settings = (field.settings as Record<string, unknown>) || {}
    const allowedModels = (settings.allowed_models as string[]) || []

    if (allowedModels.length === 0) continue

    // Use the previews API to get display names efficiently
    try {
      const response = await fetch("/api/records/previews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: validIds,
          allowedModels: allowedModels,
        }),
      })

      if (response.ok) {
        const previews = await response.json()
        if (Array.isArray(previews) && previews.length > 0) {
          // If the original was an array, return array of previews, else return single preview
          const resolvedVal = Array.isArray(val) ? previews : previews[0]

          // Write to the field name (e.g. 'season')
          resolved[field.field_name] = resolvedVal

          // Also write to common database column variations (e.g. 'season_id')
          // to ensure display logic finds it regardless of which key it checks
          resolved[`${field.field_name}_id`] = resolvedVal
          resolved[`${field.field_name}_uuid`] = resolvedVal
        }
      }
    } catch (err) {
      console.error(
        `Error resolving reference for field ${field.field_name}:`,
        err
      )
    }
  }

  return resolved
}
