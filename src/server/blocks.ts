import { createClient } from "@/utils/supabase-server"
import { CMSBlock } from "@/types/fields"

/**
 * Fetches all blocks from the registry on the server.
 */
export async function getBlocks(): Promise<CMSBlock[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching blocks on server:", error)
    return []
  }

  return (data as CMSBlock[]) || []
}
