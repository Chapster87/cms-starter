import { supabase } from "@/utils/supabaseClient"

export interface RecordBase {
  id: string
  created_at?: string
  [key: string]: unknown
}

/**
 * Service for handling native Supabase (PostgREST) operations for models.
 * This refactored version replaces GraphQL logic with standard Supabase client calls.
 */
export const dataService = {
  /**
   * Fetches all records for a given model.
   * @param model - The name of the model (table).
   * @returns A promise that resolves to an array of records.
   */
  async getRecords(model: string): Promise<RecordBase[]> {
    const { data, error } = await supabase
      .from(model)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(`Error fetching records for '${model}':`, error.message)
      throw error
    }

    return data as RecordBase[]
  },

  /**
   * Fetches a single record by its ID.
   * @param model - The name of the model.
   * @param id - The UUID of the record.
   * @param fields - Optional string of fields to fetch (default all "*").
   */
  async getRecordById(
    model: string,
    id: string,
    fields: string = "*"
  ): Promise<RecordBase | null> {
    // If fields is a newline-separated list, we need to convert it to comma-separated for Supabase
    const sanitizedFields = fields.replace(/\s+/g, ",")

    const { data, error } = await supabase
      .from(model)
      .select(sanitizedFields)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null // Record not found
      console.error(
        `Error fetching record '${id}' from '${model}':`,
        error.message
      )
      throw error
    }

    return data as unknown as RecordBase
  },

  /**
   * Deletes a record by its ID.
   * @param model - The name of the model.
   * @param id - The UUID of the record.
   */
  async deleteRecord(model: string, id: string): Promise<void> {
    const { error } = await supabase.from(model).delete().eq("id", id)

    if (error) {
      console.error(
        `Error deleting record '${id}' from '${model}':`,
        error.message
      )
      throw error
    }
  },

  /**
   * Updates an existing record using upsert.
   * @param model - The name of the model.
   * @param id - The UUID of the record.
   * @param changes - An object containing the fields to update.
   */
  async updateRecord(
    model: string,
    id: string,
    changes: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase
      .from(model)
      .upsert({ ...changes, id })
      .select()

    if (error) {
      console.error(
        `Error updating record '${id}' in '${model}':`,
        error.message
      )
      throw error
    }
  },

  /**
   * Inserts a new record using upsert.
   * @param model - The name of the model.
   * @param recordData - The data for the new record.
   */
  async createRecord(
    model: string,
    recordData: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase.from(model).upsert([recordData]).select()

    if (error) {
      console.error(`Error creating record in '${model}':`, error.message)
      throw error
    }
  },
}
