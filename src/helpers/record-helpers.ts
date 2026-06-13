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
]

/**
 * Discovers a sensible display name for a record.
 *
 * @param record - The record data.
 * @param modelFriendlyName - The friendly name of the model (optional fallback).
 * @param isSingleton - Whether the model is a singleton.
 * @returns A string representing the record's display name.
 */
export function getRecordDisplayName(
  record: RecordBase | null | undefined,
  modelFriendlyName?: string,
  isSingleton?: boolean
): string {
  if (!record) return modelFriendlyName || "Record"

  // 1. Try common name fields
  for (const field of NAME_DISCOVERY_FIELDS) {
    if (record[field] && typeof record[field] === "string") {
      return record[field] as string
    }
  }

  // 2. If it's a singleton and we have a model friendly name, use it as the definitive title
  if (isSingleton && modelFriendlyName) {
    return modelFriendlyName
  }

  // 3. Fallback: look for the first string field that isn't a system field
  const systemFields = [
    "id",
    "created_at",
    "updated_at",
    "slug",
    "status",
    "_draft",
  ]
  for (const key in record) {
    if (
      !systemFields.includes(key) &&
      typeof record[key] === "string" &&
      (record[key] as string).length > 0
    ) {
      return record[key] as string
    }
  }

  // 4. Final fallback to slug or truncated ID
  if (record.slug && typeof record.slug === "string") {
    return record.slug
  }

  return `Record ${record.id.substring(0, 8)}...`
}
