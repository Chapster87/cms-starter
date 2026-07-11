import { SupabaseClient } from "@supabase/supabase-js"
import { AnyCMSModel, CMSModelName } from "../../../types/cms-generated"
import { RecordManager } from "../types"

/**
 * SupabaseRecordManager implements the RecordManager interface using a Supabase client.
 * It provides methods to interact with CMS records stored in Supabase tables.
 */
export class SupabaseRecordManager implements RecordManager {
  /**
   * @param client - An authenticated Supabase client (usually service-role).
   */
  constructor(private client: SupabaseClient) {}

  /**
   * Fetches all records for a specific model.
   * @param model - The name of the CMS model (table name).
   * @returns A list of records.
   */
  async getRecords(model: CMSModelName): Promise<AnyCMSModel[]> {
    const { data, error } = await this.client.from(model).select("*")

    if (error) {
      throw new Error(
        `Failed to fetch records for model ${model}: ${error.message}`
      )
    }

    return data as AnyCMSModel[]
  }

  /**
   * Fetches a single record by its ID.
   * @param model - The name of the CMS model.
   * @param id - The unique identifier of the record.
   * @returns The record if found, otherwise null.
   */
  async getRecordById(
    model: CMSModelName,
    id: string
  ): Promise<AnyCMSModel | null> {
    const { data, error } = await this.client
      .from(model)
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null // No rows found
      throw new Error(
        `Failed to fetch record ${id} for model ${model}: ${error.message}`
      )
    }

    return data as AnyCMSModel
  }

  /**
   * Creates a new record.
   * @param model - The name of the CMS model.
   * @param data - The record data to insert.
   * @returns The created record.
   */
  async createRecord(
    model: CMSModelName,
    data: Partial<AnyCMSModel>
  ): Promise<AnyCMSModel> {
    const { data: inserted, error } = await this.client
      .from(model)
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(
        `Failed to create record for model ${model}: ${error.message}`
      )
    }

    return inserted as AnyCMSModel
  }

  /**
   * Updates an existing record.
   * @param model - The name of the CMS model.
   * @param id - The unique identifier of the record to update.
   * @param data - The partial data to update.
   * @returns The updated record.
   */
  async updateRecord(
    model: CMSModelName,
    id: string,
    data: Partial<AnyCMSModel>
  ): Promise<AnyCMSModel> {
    const { data: updated, error } = await this.client
      .from(model)
      .update(data)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(
        `Failed to update record ${id} for model ${model}: ${error.message}`
      )
    }

    return updated as AnyCMSModel
  }

  /**
   * Deletes a record.
   * @param model - The name of the CMS model.
   * @param id - The unique identifier of the record to delete.
   */
  async deleteRecord(model: CMSModelName, id: string): Promise<void> {
    const { error } = await this.client.from(model).delete().eq("id", id)

    if (error) {
      throw new Error(
        `Failed to delete record ${id} for model ${model}: ${error.message}`
      )
    }
  }
}
