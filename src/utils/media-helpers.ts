import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Deeply resolves media IDs into full media objects within JSON structures.
 * Useful for hydrating media assets in complex record data.
 */
export async function deeplyResolveMedia(data: unknown): Promise<unknown> {
  if (!data) return data

  // Handle UUID strings that might be media IDs
  if (
    typeof data === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)
  ) {
    const { data: media } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", data)
      .single()

    if (media) return media
    return data
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return Promise.all(data.map((item) => deeplyResolveMedia(item)))
  }

  // Handle objects
  if (typeof data === "object" && data !== null) {
    const dataObj = data as Record<string, unknown>
    // If it's already a resolved media object (has url/name), don't re-resolve
    if (dataObj.url && dataObj.id) return dataObj

    const resolved: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(dataObj)) {
      resolved[key] = await deeplyResolveMedia(value)
    }
    return resolved
  }

  return data
}
