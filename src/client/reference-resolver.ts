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
  const supabase = createClient()
  const resolved = { ...record }

  // Filter for reference-type fields that have values
  const referenceFields = fields.filter(
    (f) => f.field_type === "reference" && record[f.field_name]
  )

  if (referenceFields.length === 0) return record

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  for (const field of referenceFields) {
    const val = record[field.field_name]
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
          resolved[field.field_name] = Array.isArray(val)
            ? previews
            : previews[0]
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
