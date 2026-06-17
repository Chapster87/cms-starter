import { MediaAsset } from "@/types/media"
import { createClient } from "@/utils/supabase"

/**
 * Service for managing media asset metadata in Supabase.
 */
export const mediaService = {
  /**
   * Fetches all media assets from the registry.
   */
  async getAssets(options?: {
    folder?: string
    tag?: string
  }): Promise<MediaAsset[]> {
    const supabase = createClient()
    let query = supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })

    if (options?.folder) {
      query = query.eq("folder", options.folder)
    }

    if (options?.tag) {
      query = query.contains("tags", [options.tag])
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching media assets:", error.message)
      throw error
    }

    return data as MediaAsset[]
  },

  /**
   * Registers a new asset in the database.
   */
  async registerAsset(asset: Partial<MediaAsset>): Promise<MediaAsset> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("media_assets")
      .insert([{ ...asset, created_by: user?.id }])
      .select()
      .single()

    if (error) {
      console.error("Error registering media asset:", error.message)
      throw error
    }

    return data as MediaAsset
  },

  /**
   * Deletes an asset record from the database.
   */
  async deleteAsset(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("media_assets").delete().eq("id", id)

    if (error) {
      console.error("Error deleting media asset record:", error.message)
      throw error
    }
  },

  /**
   * Deletes multiple asset records from the database.
   */
  async deleteAssets(ids: string[]): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("media_assets").delete().in("id", ids)

    if (error) {
      console.error("Error deleting media assets:", error.message)
      throw error
    }
  },

  /**
   * Updates multiple asset records in the database.
   */
  async updateAssets(
    ids: string[],
    updates: Partial<MediaAsset>
  ): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from("media_assets")
      .update(updates)
      .in("id", ids)

    if (error) {
      console.error("Error updating media assets:", error.message)
      throw error
    }
  },

  /**
   * Fetches a single asset by its ID.
   */
  async getAssetById(id: string): Promise<MediaAsset | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }

    return data as MediaAsset
  },

  /**
   * Gets unique folders from the media library.
   */
  async getFolders(): Promise<string[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("media_assets").select("folder")

    if (error) throw error

    const folders = Array.from(new Set(data.map((item) => item.folder))).sort()
    return folders
  },
}
