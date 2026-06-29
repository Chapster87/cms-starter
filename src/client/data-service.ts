import { getDelta } from "@/utils/diff"
import { createClient } from "@/utils/supabase"
import { resolveReferences } from "./reference-resolver"

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
   * @param options - Optional parameters for ordering and resolution.
   * @returns A promise that resolves to an array of records.
   */
  async getRecords<T extends RecordBase = RecordBase>(
    model: string,
    options: {
      orderBy?: string
      orderDir?: "asc" | "desc"
      resolve?: boolean
    } = {}
  ): Promise<T[]> {
    const {
      orderBy = "created_at",
      orderDir = "desc",
      resolve = false,
    } = options
    const supabase = createClient()
    const { data, error } = await supabase
      .from(model)
      .select("*")
      .order(orderBy, { ascending: orderDir === "asc" })

    if (error) {
      console.error(`Error fetching records for '${model}':`, error.message)
      throw error
    }

    let records = data as T[]

    if (resolve && records.length > 0) {
      // Fetch schema to know what to resolve
      const res = await fetch(`/api/models/schema/fields?table=${model}`)
      if (res.ok) {
        const fields = await res.json()
        records = await Promise.all(
          records.map((r) => resolveReferences(r, fields) as Promise<T>)
        )
      }
    }

    return records
  },

  /**
   * Fetches a single record by its ID.
   * @param model - The name of the model.
   * @param id - The UUID of the record.
   * @param options - Optional parameters for fields and resolution.
   */
  async getRecordById<T extends RecordBase = RecordBase>(
    model: string,
    id: string,
    options: {
      fields?: string
      resolve?: boolean
    } = {}
  ): Promise<T | null> {
    const { fields = "*", resolve = false } = options
    const supabase = createClient()
    // Basic UUID validation
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const sanitizedFields = fields.replace(/\s+/g, ",")
    let query = supabase.from(model).select(sanitizedFields)

    if (isUuid) {
      query = query.eq("id", id)
    } else {
      // Fallback to slug if not a UUID
      query = query.eq("slug", id)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === "PGRST116") return null // Record not found
      console.error(
        `Error fetching record '${id}' from '${model}':`,
        error.message
      )
      throw error
    }

    let record = data as unknown as T

    if (resolve && record) {
      const res = await fetch(`/api/models/schema/fields?table=${model}`)
      if (res.ok) {
        const fields = await res.json()
        record = (await resolveReferences(record, fields)) as T
      }
    }

    return record
  },

  /**
   * Fetches a single record by its Slug.
   * @param model - The name of the model.
   * @param slug - The slug of the record.
   * @param options - Optional parameters for resolution.
   */
  async getRecordBySlug<T extends RecordBase = RecordBase>(
    model: string,
    slug: string,
    options: {
      resolve?: boolean
    } = {}
  ): Promise<T | null> {
    const { resolve = false } = options
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

      let record = data as unknown as T

      if (resolve && record) {
        const res = await fetch(`/api/models/schema/fields?table=${model}`)
        if (res.ok) {
          const fields = await res.json()
          record = (await resolveReferences(record, fields)) as T
        }
      }

      return record
    } catch (_err) {
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
   * Logs an action to the audit log.
   * Optimizes storage by only saving deltas and consolidating recent auto-saves.
   */
  async logAction(
    modelId: string,
    recordId: string,
    action: string,
    changes: Record<string, unknown> | null = null,
    previousData: Record<string, unknown> | null = null
  ): Promise<void> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    let finalChanges = changes

    // 1. If we have previous data, calculate the delta
    if (changes && previousData) {
      finalChanges = getDelta(previousData, changes)
      // If nothing changed, don't log (unless it's a specific non-data action like publish)
      if (
        Object.keys(finalChanges || {}).length === 0 &&
        action === "draft_update"
      ) {
        return
      }
    }

    // 2. Consolidate auto-saves (draft_update)
    if (action === "draft_update") {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      const { data: recentLog } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("record_id", recordId)
        .eq("user_id", user.id)
        .eq("action", "draft_update")
        .gt("created_at", fiveMinutesAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (recentLog) {
        // Merge deltas
        const mergedChanges = {
          ...(recentLog.changes as Record<string, unknown>),
          ...finalChanges,
        }

        await supabase
          .from("audit_logs")
          .update({
            changes: mergedChanges,
            created_at: new Date().toISOString(), // Bump the time to show it's fresh
          })
          .eq("id", recentLog.id)

        return
      }
    }

    // 3. Standard Insert for new actions
    await supabase.from("audit_logs").insert({
      model_id: modelId,
      record_id: recordId,
      user_id: user.id,
      action,
      changes: finalChanges,
    })

    // 4. Pruning: Keep only last 50 logs for this record
    // We do this asynchronously to not block the response
    this.pruneLogs(recordId)
  },

  /**
   * Prunes old audit logs for a record.
   */
  async pruneLogs(recordId: string): Promise<void> {
    const supabase = createClient()
    const { data: logs } = await supabase
      .from("audit_logs")
      .select("id")
      .eq("record_id", recordId)
      .order("created_at", { ascending: false })
      .range(50, 100) // Target logs beyond the first 50

    if (logs && logs.length > 0) {
      const idsToDelete = logs.map((l) => l.id)
      await supabase.from("audit_logs").delete().in("id", idsToDelete)
    }
  },

  /**
   * Updates an existing record using upsert.
   * Automatically unwraps stringified JSON for clean storage.
   */
  async updateRecord(
    model: string,
    id: string,
    changes: Record<string, unknown>,
    modelId?: string
  ): Promise<void> {
    const supabase = createClient()

    // Ensure we don't save stringified JSON into what should be native JSON columns
    const cleanChanges = { ...changes }

    // Strip virtual and read-only system fields
    delete cleanChanges._resolved
    delete cleanChanges.created_at
    delete cleanChanges.updated_at

    Object.keys(cleanChanges).forEach((key) => {
      const val = cleanChanges[key]
      if (
        typeof val === "string" &&
        (val.trim().startsWith("{") || val.trim().startsWith("["))
      ) {
        try {
          cleanChanges[key] = JSON.parse(val)
        } catch {
          /* Not valid JSON, keep as string */
        }
      }
    })

    // Fetch previous data for diffing
    const { data: previousData } = await supabase
      .from(model)
      .select("*")
      .eq("id", id)
      .single()

    const { error } = await supabase
      .from(model)
      .upsert({ ...cleanChanges, id })
      .select()

    if (!error && modelId) {
      await this.logAction(
        modelId,
        id,
        "update",
        cleanChanges,
        previousData as Record<string, unknown>
      )
    }

    if (error) {
      console.error(
        `Error updating record '${id}' in '${model}':`,
        error.message
      )
      throw error
    }
  },

  /**
   * Auto-saves changes to the shadow _draft column.
   * Does NOT affect the live content.
   */
  async autoSaveRecord(
    model: string,
    id: string,
    data: Record<string, unknown>,
    modelId?: string
  ): Promise<void> {
    const supabase = createClient()

    // Fetch previous draft for diffing
    const { data: currentRecord } = await supabase
      .from(model)
      .select("_draft")
      .eq("id", id)
      .single()

    const previousDraft =
      (currentRecord?._draft as Record<string, unknown>) || {}

    // When auto-saving, we wrap the data into the _draft column
    const { error } = await supabase
      .from(model)
      .update({ _draft: data })
      .eq("id", id)

    if (!error && modelId) {
      // For auto-saves, we log with a specific action to distinguish from manual saves
      await this.logAction(modelId, id, "draft_update", data, previousDraft)
    }

    if (error) {
      console.error(
        `Error auto-saving record '${id}' in '${model}':`,
        error.message
      )
      throw error
    }
  },

  /**
   * Discards any unpublished changes by clearing the _draft column.
   */
  async discardChanges(model: string, id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from(model)
      .update({ _draft: null })
      .eq("id", id)

    if (error) {
      console.error(
        `Error discarding changes for record '${id}' in '${model}':`,
        error.message
      )
      throw error
    }
  },

  /**
   * Publishes a record by merging draft data into main columns and clearing _draft.
   */
  async publishRecord(
    model: string,
    id: string,
    data: Record<string, unknown>,
    modelId?: string
  ): Promise<void> {
    const supabase = createClient()

    // 1. Prepare clean data for main columns
    const cleanData = { ...data }

    // Strip virtual and read-only system fields
    delete cleanData._resolved
    delete cleanData.created_at
    delete cleanData.updated_at

    Object.keys(cleanData).forEach((key) => {
      const val = cleanData[key]
      if (
        typeof val === "string" &&
        (val.trim().startsWith("{") || val.trim().startsWith("["))
      ) {
        try {
          cleanData[key] = JSON.parse(val)
        } catch {
          /* ignore */
        }
      }
    })

    // Fetch previous data for diffing
    const { data: previousData } = await supabase
      .from(model)
      .select("*")
      .eq("id", id)
      .single()

    // 2. Update record: spread data into columns, set status, clear _draft
    const { error } = await supabase
      .from(model)
      .update({
        ...cleanData,
        status: "published",
        _draft: null,
      })
      .eq("id", id)

    if (!error && modelId) {
      await this.logAction(
        modelId,
        id,
        "publish",
        cleanData,
        previousData as Record<string, unknown>
      )
    }

    if (error) {
      console.error(
        `Error publishing record '${id}' in '${model}':`,
        error.message
      )
      throw error
    }
  },

  /**
   * Unpublishes a record by setting status to 'draft'.
   * The live content remains in the columns but is no longer served as 'published'.
   */
  async unpublishRecord(
    model: string,
    id: string,
    modelId?: string
  ): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from(model)
      .update({ status: "draft" })
      .eq("id", id)

    if (!error && modelId) {
      await this.logAction(modelId, id, "unpublish")
    }

    if (error) {
      console.error(
        `Error unpublishing record '${id}' from '${model}':`,
        error.message
      )
      throw error
    }
  },

  /**
   * Inserts a new record using upsert.
   * Automatically unwraps stringified JSON for clean storage.
   */
  async createRecord<T extends RecordBase = RecordBase>(
    model: string,
    recordData: Record<string, unknown>,
    modelId?: string
  ): Promise<T | null> {
    const supabase = createClient()

    // Ensure we don't save stringified JSON into what should be native JSON columns
    const cleanData = { ...recordData }

    // Strip virtual fields
    delete cleanData._resolved

    Object.keys(cleanData).forEach((key) => {
      const val = cleanData[key]
      if (
        typeof val === "string" &&
        (val.trim().startsWith("{") || val.trim().startsWith("["))
      ) {
        try {
          cleanData[key] = JSON.parse(val)
        } catch {
          /* Not valid JSON, keep as string */
        }
      }
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from(model)
      .upsert([{ ...cleanData, created_by: user?.id, updated_by: user?.id }])
      .select()
      .single()

    if (!error && data && modelId) {
      await this.logAction(
        modelId,
        (data as unknown as RecordBase).id,
        "create",
        cleanData
      )
    }

    if (error) {
      console.error(`Error creating record in '${model}':`, error.message)
      throw error
    }

    return data as T
  },
}
