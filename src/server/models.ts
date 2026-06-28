import { createClient } from "@/utils/supabase-server"
import { ModelRegistryEntry } from "@/hooks/use-models"

/**
 * Fetches all models from the registry on the server.
 */
export async function getModels(): Promise<ModelRegistryEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("models")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching models on server:", error)
    return []
  }

  return (data as ModelRegistryEntry[]) || []
}
