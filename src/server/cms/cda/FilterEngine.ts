import { SupabaseClient } from "@supabase/supabase-js"
import { CMSModel, ExtendedCMSField } from "./ResolverFactory"

export class FilterEngine {
  constructor(
    private supabase: SupabaseClient,
    private fields: ExtendedCMSField[],
    private models: CMSModel[]
  ) {}

  /**
   * Applies filters to a Supabase query builder based on GraphQL where input.
   */
  public async applyFilters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryBuilder: any,
    currentWhere: Record<string, unknown> | null | undefined,
    currentModel: CMSModel,
    isSubQuery = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ query: any }> {
    if (!currentWhere || Object.keys(currentWhere).length === 0)
      return { query: queryBuilder }
    let localQuery = queryBuilder

    for (const key of Object.keys(currentWhere)) {
      const val = currentWhere[key]
      const field = this.fields.find(
        (f) =>
          f.model_id === (currentModel.id || currentModel.model_id) &&
          f.slug === key
      )

      if (
        field?.field_type === "reference" &&
        typeof val === "object" &&
        val !== null
      ) {
        const valObj = val as Record<string, unknown>

        if (
          Object.keys(valObj).length === 1 &&
          valObj.id &&
          typeof valObj.id === "string"
        ) {
          if (!isSubQuery) {
            localQuery = localQuery.filter(key, "eq", `"${valObj.id}"`)
          } else {
            localQuery = localQuery.eq(key, valObj.id)
          }
          continue
        }

        const allowedIds = (field.settings?.allowed_models as string[]) || []
        const linkedModelId =
          allowedIds[0] ||
          field.validation_rules?.linkedModel ||
          (field.settings?.linkedModel as string)
        const linkedModel = this.models.find((m) => m.id === linkedModelId)

        if (linkedModel) {
          const subQuery = this.supabase
            .from(linkedModel.table_name)
            .select("id")
          const { query: filteredSubQuery } = await this.applyFilters(
            subQuery,
            valObj,
            linkedModel,
            true
          )

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: matchedRecords } = await (filteredSubQuery as any)
          const matchedIds = (
            (matchedRecords as { id: string }[] | null) || []
          ).map((r) => `"${r.id}"`)

          if (matchedIds.length === 0) {
            localQuery = localQuery.filter(
              key,
              "eq",
              '"00000000-0000-0000-0000-000000000000"'
            )
          } else if (matchedIds.length === 1) {
            localQuery = localQuery.filter(key, "eq", matchedIds[0])
          } else {
            const orFilter = matchedIds
              .map((id: string) => `${key}.eq.${id}`)
              .join(",")
            localQuery = localQuery.or(orFilter)
          }
        }
      } else if (val !== undefined && val !== null) {
        const isBaseField = [
          "id",
          "created_at",
          "updated_at",
          "status",
        ].includes(key)
        if (field || isBaseField) {
          localQuery = localQuery.eq(key, val)
        }
      }
    }
    return { query: localQuery }
  }
}
