import { RecordBase } from "@/client/data-service"

/**
 * Standard fields to check for a display name.
 */
export const NAME_DISCOVERY_FIELDS = [
  "name",
  "title",
  "label",
  "heading",
  "display_name",
  "friendly_name",
  "full_name",
  "event_name",
  "season",
]

/**
 * Helper to check if a value is a UUID.
 */
const isUuid = (val: unknown): boolean =>
  typeof val === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

/**
 * Discovers a sensible display name for a record.
 *
 * @param record - The record data.
 * @param modelFriendlyName - The friendly name of the model (optional fallback).
 * @param isSingleton - Whether the model is a singleton.
 * @returns A string representing the record's display name.
 */
export function getRecordDisplayName(
  record:
    | (RecordBase & { _resolved?: Record<string, unknown> })
    | null
    | undefined,
  modelFriendlyName?: string,
  isSingleton?: boolean,
  listColumns?: string[] | null
): string {
  if (!record) return modelFriendlyName || "Record"

  // 1. Try common name fields first (title, name, etc. on the record itself)
  for (const field of NAME_DISCOVERY_FIELDS) {
    const val = record[field]
    if (val) {
      if (typeof val === "string" && !isUuid(val)) {
        return val
      }
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        const obj = val as Record<string, unknown>
        const name = (obj.display_name ||
          obj.name ||
          obj.title ||
          obj.label) as string | undefined
        if (name && !isUuid(name)) return String(name)
      }
    }
  }

  // 2. Priority: check for resolved preview data (added in resolveRecordReferences)
  const resolved = record._resolved
  if (resolved && typeof resolved === "object") {
    // If we have list columns, try to find a resolved version of one of them
    if (listColumns && listColumns.length > 0) {
      for (const col of listColumns) {
        if (resolved[col]) {
          const res = resolved[col] as Record<string, unknown>
          const name = (res.display_name || res.name || res.title) as
            | string
            | undefined
          if (name && !isUuid(name)) return name
        }
      }
    }
    // Fallback to first available resolved name
    for (const key in resolved) {
      const res = resolved[key]
      if (res && typeof res === "object") {
        const obj = res as Record<string, unknown>
        const name = (obj.display_name || obj.name || obj.title) as
          | string
          | undefined
        if (name && !isUuid(name)) return name
      }
    }
  }

  // 3. Try explicit list columns
  // We iterate through them to find the first one that yields a non-UUID string.
  // We also check for common ID suffixes if the exact column name isn't found.
  if (listColumns && listColumns.length > 0) {
    for (const displayCol of listColumns) {
      if (displayCol === "id" || displayCol === "slug") continue

      // Check exact match, and then common variations (e.g. season -> season_id)
      const candidates = [displayCol, `${displayCol}_id`, `${displayCol}_uuid`]

      for (const candidate of candidates) {
        const val = record[candidate]
        if (val != null) {
          if (typeof val === "object" && val !== null) {
            // Might be a resolved reference object
            const obj = val as Record<string, unknown>
            const name = (obj.display_name ||
              obj.name ||
              obj.title ||
              obj.label ||
              obj.text ||
              obj.heading) as string | undefined
            if (name && !isUuid(name)) return String(name)
          }

          if (typeof val === "string" && !isUuid(val) && val.length > 0) {
            return val
          }
        }
      }
    }
  }

  // 4. If it's a singleton and we have a model friendly name, use it as the definitive title
  if (isSingleton && modelFriendlyName) {
    return modelFriendlyName
  }

  // 5. Fallback: look for the first string field that isn't a system field and isn't a UUID
  const systemFields = [
    "id",
    "created_at",
    "updated_at",
    "slug",
    "status",
    "_draft",
  ]
  for (const key in record) {
    const val = record[key]
    if (!systemFields.includes(key) && val) {
      if (typeof val === "string" && val.length > 0 && !isUuid(val)) {
        return val
      }
      if (typeof val === "object" && val !== null) {
        const obj = val as Record<string, unknown>
        const name = (obj.display_name ||
          obj.name ||
          obj.title ||
          obj.label) as string | undefined
        if (name && !isUuid(name)) return String(name)
      }
    }
  }

  // 6. Final fallback to slug or truncated ID
  if (record.slug && typeof record.slug === "string") {
    return record.slug
  }

  return `Record ${record.id.substring(0, 8)}...`
}
