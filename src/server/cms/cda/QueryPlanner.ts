import { SupabaseClient } from "@supabase/supabase-js"

/**
 * BatchContext stores pre-fetched or cached data for the duration of a GraphQL request.
 */
export interface BatchContext {
  cache: Map<string, Map<string, Record<string, unknown>>> // tableName -> (id -> record)
  supabase: SupabaseClient
}

/**
 * QueryPlanner analyzes GraphQL AST and manages batched data fetching.
 */
export class QueryPlanner {
  /**
   * Creates a fresh BatchContext for a request.
   */
  public static createBatchContext(supabase: SupabaseClient): BatchContext {
    return {
      cache: new Map(),
      supabase,
    }
  }

  /**
   * Fetches a batch of records if they are not already in the cache.
   * @param context - The current BatchContext.
   * @param tableName - The table to fetch from.
   * @param ids - The IDs to fetch.
   */
  public static async ensureBatch(
    context: BatchContext,
    tableName: string,
    ids: string[]
  ): Promise<void> {
    if (!ids.length) return

    if (!context.cache.has(tableName)) {
      context.cache.set(tableName, new Map())
    }

    const tableCache = context.cache.get(tableName)!
    const missingIds = ids.filter((id) => !tableCache.has(id))

    if (missingIds.length > 0) {
      const { data, error } = await context.supabase
        .from(tableName)
        .select("*")
        .in("id", missingIds)

      if (error) {
        console.error(
          `QueryPlanner: Error fetching batch for ${tableName}`,
          error
        )
        return
      }

      if (data) {
        data.forEach((record: Record<string, unknown>) => {
          if (record.id && typeof record.id === "string") {
            tableCache.set(record.id, record)
          }
        })
      }
    }
  }

  /**
   * Gets a record from the cache.
   */
  public static getFromCache(
    context: BatchContext,
    tableName: string,
    id: string
  ): Record<string, unknown> | null {
    return context.cache.get(tableName)?.get(id) || null
  }
}
