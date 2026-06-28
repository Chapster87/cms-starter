import { createClient } from "@/utils/supabase-server"
import { RecordBase } from "@/client/data-service"
import { resolveRecordReferences } from "@/utils/reference-resolution"

/**
 * Fetches a single record by its ID on the server.
 */
export async function getRecordById(
  model: string,
  id: string,
  options: { resolve?: boolean } = {}
): Promise<RecordBase | null> {
  const { resolve = false } = options
  const supabase = await createClient()

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  let record: RecordBase | null = null

  if (isUuid) {
    const { data, error } = await supabase
      .from(model)
      .select("*")
      .eq("id", id)
      .single()

    if (!error && data) record = data as RecordBase
  }

  if (!record) {
    // Try slug as fallback
    const { data: slugData, error: slugError } = await supabase
      .from(model)
      .select("*")
      .eq("slug", id)
      .single()

    if (!slugError && slugData) record = slugData as RecordBase
  }

  if (record && resolve) {
    // To resolve references, we need the model ID from the registry
    const { data: modelData } = await supabase
      .from("models")
      .select("id")
      .eq("table_name", model)
      .single()

    if (modelData) {
      record = (await resolveRecordReferences(
        record as Record<string, unknown>,
        modelData.id
      )) as RecordBase
    }
  }

  return record
}
