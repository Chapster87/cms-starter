import { createClient } from "@/utils/supabase"

export interface RecordBase {
  id: string
  created_at?: string
  updated_at?: string
  slug?: string
  [key: string]: unknown
}

/**
 * Service for handling native Supabase (PostgREST) operations for models.
 */
export const dataService = {
  /**
   * Fetches all records for a given model.
   * @param model - The name of the model (table).
   * @returns A promise that resolves to an array of records.
   */
  async getRecords(model: string): Promise<RecordBase[]> {
    const supabase = createClient()
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
    const supabase = createClient()
    // Basic UUID validation to prevent 400 errors from Supabase
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) return null

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
   * Fetches a single record by its Slug.
   * @param model - The name of the model.
   * @param slug - The slug of the record.
   */
  async getRecordBySlug(
    model: string,
    slug: string
  ): Promise<RecordBase | null> {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from(model)
        .select("*")
        .eq("slug", slug)
        .single()

      if (error) {
        if (error.code === "PGRST116") return null // Record not found
        return null
      }

      return data as unknown as RecordBase
    } catch (err) {
      // Column might not exist
      return null
    }
  },

  /**
   * Deletes a record by its ID.
   */
  async deleteRecord(model: string, id: string): Promise<void> {
    const supabase = createClient()
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
   */
  async updateRecord(
    model: string,
    id: string,
    changes: Record<string, unknown>
  ): Promise<void> {
    const supabase = createClient()
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
   */
  async createRecord(
    model: string,
    recordData: Record<string, unknown>
  ): Promise<RecordBase | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(model)
      .upsert([recordData])
      .select()
      .single()

    if (error) {
      console.error(`Error creating record in '${model}':`, error.message)
      throw error
    }

    return data as RecordBase
  },
}
