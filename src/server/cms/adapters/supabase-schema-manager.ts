import { SupabaseClient } from "@supabase/supabase-js"
import { CMSModelName } from "../../../types/cms-generated"
import { CMSField, CMSBlock } from "../../../types/fields"
import { SchemaManager } from "../types"

/**
 * SupabaseSchemaManager implements the SchemaManager interface using a Supabase client.
 * It manages access to CMS schema metadata (fields, blocks, etc.) stored in Supabase.
 */
export class SupabaseSchemaManager implements SchemaManager {
  /**
   * @param client - An authenticated Supabase client.
   */
  constructor(private client: SupabaseClient) {}

  /**
   * Fetches the configuration for a specific field.
   * @param model - The name of the CMS model.
   * @param fieldSlug - The slug/identifier of the field.
   */
  async getField(
    model: CMSModelName,
    fieldSlug: string
  ): Promise<CMSField | null> {
    const { data, error } = await this.client
      .from("cms_fields")
      .select("*")
      .eq("model_id", model)
      .eq("slug", fieldSlug)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(
        `Failed to fetch field ${fieldSlug} for model ${model}: ${error.message}`
      )
    }

    return data as CMSField
  }

  /**
   * Fetches all fields defined for a specific model.
   * @param model - The name of the CMS model.
   */
  async getFieldsForModel(model: CMSModelName): Promise<CMSField[]> {
    const { data, error } = await this.client
      .from("cms_fields")
      .select("*")
      .eq("model_id", model)
      .order("ui_order", { ascending: true })

    if (error) {
      throw new Error(
        `Failed to fetch fields for model ${model}: ${error.message}`
      )
    }

    return data as CMSField[]
  }

  /**
   * Fetches a block definition by its identifier.
   * @param blockId - The ID or slug of the block.
   */
  async getBlock(blockId: string): Promise<CMSBlock | null> {
    const { data, error } = await this.client
      .from("cms_blocks")
      .select("*, fields:cms_fields(*)")
      .or(`id.eq.${blockId},api_id.eq.${blockId}`)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Failed to fetch block ${blockId}: ${error.message}`)
    }

    return data as CMSBlock
  }

  /**
   * Fetches all available blocks in the CMS.
   */
  async getAllBlocks(): Promise<CMSBlock[]> {
    const { data, error } = await this.client
      .from("cms_blocks")
      .select("*, fields:cms_fields(*)")
      .order("display_order", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch all blocks: ${error.message}`)
    }

    return data as CMSBlock[]
  }
}
