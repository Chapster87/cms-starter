import { SupabaseClient } from "@supabase/supabase-js"

import { CMSField } from "@/types/fields"

/**
 * Extended CMSField to include metadata used for relations
 */
export interface ExtendedCMSField extends CMSField {
  validation_rules?: {
    linkedModel?: string
    [key: string]: unknown
  }
}

/**
 * CMSModel representation used for registry models
 */
export interface CMSModel {
  id: string
  model_id: string
  model_name: string
  friendly_name: string
  table_name: string
  has_draft_mode?: boolean
  is_singleton?: boolean
  [key: string]: unknown
}

/**
 * ResolverFactory standardizes field resolution for CMS content.
 * It provides isolated, testable resolvers for Media, Reference, and Block types.
 */
export class ResolverFactory {
  private supabase: SupabaseClient
  private validModels: CMSModel[]

  /**
   * Creates an instance of ResolverFactory.
   * @param supabase - The Supabase Client.
   * @param validModels - The active CMS models.
   */
  constructor(supabase: SupabaseClient, validModels: CMSModel[]) {
    this.supabase = supabase
    this.validModels = validModels
  }

  /**
   * Helper to parse string values if they are stored as JSON strings.
   * @param val - The raw value.
   * @returns The parsed object/value or original value if parsing fails.
   */
  private parseJsonValue(val: unknown) {
    if (typeof val === "string") {
      try {
        return JSON.parse(val)
      } catch {
        return val
      }
    }
    return val
  }

  /**
   * Creates a resolver for media assets.
   * @param field - The field configuration.
   * @returns The resolver function.
   */
  public createMediaResolver(field: ExtendedCMSField) {
    return async (parent: Record<string, unknown>): Promise<unknown> => {
      const draft = parent._draft as Record<string, unknown> | null
      const val =
        draft && draft[field.slug] !== undefined
          ? draft[field.slug]
          : parent[field.slug]

      const parsedValue = this.parseJsonValue(val)
      if (!parsedValue) return null

      const isMultiple = field.settings?.allow_multiple === true
      const assets = Array.isArray(parsedValue) ? parsedValue : [parsedValue]

      const assetIds = assets
        .map((a) => {
          return typeof a === "string" ? a : a?.id
        })
        .filter(Boolean) as string[]

      if (assetIds.length > 0) {
        const { data: mediaData } = await this.supabase
          .from("media_assets")
          .select("*")
          .in("id", assetIds)

        if (mediaData && mediaData.length > 0) {
          const dataMap = new Map(
            mediaData.map((m) => {
              return [m.id, m]
            })
          )
          const results = assetIds
            .map((id) => {
              return dataMap.get(id)
            })
            .filter(Boolean)
          return isMultiple ? results : results[0] || null
        }
      }
      return isMultiple ? assets : assets[0] || null
    }
  }

  /**
   * Creates a resolver for model references.
   * @param field - The field configuration.
   * @param linkedModel - The target model of the reference.
   * @returns The resolver function.
   */
  public createReferenceResolver(
    field: ExtendedCMSField,
    linkedModel: CMSModel
  ) {
    const isMultiple = field.settings?.allow_multiple === true
    return async (parent: Record<string, unknown>): Promise<unknown> => {
      const rawValue = parent[field.slug]
      if (!rawValue) return isMultiple ? [] : null

      const ids = this.parseJsonValue(rawValue)
      const idArray = Array.isArray(ids) ? (ids as string[]) : [ids as string]
      if (idArray.length === 0 || !idArray[0]) return isMultiple ? [] : null

      const { data } = await this.supabase
        .from(linkedModel.table_name)
        .select("*")
        .in("id", idArray)

      const dataMap = new Map(
        ((data as Record<string, unknown>[] | null) || []).map((item) => {
          return [item.id as string, item]
        })
      )
      const results = idArray
        .map((id) => {
          return dataMap.get(id)
        })
        .filter(Boolean)

      return isMultiple ? results : results[0] || null
    }
  }

  /**
   * Creates a resolver for blocks and deep/JSON fields.
   * @param field - The field configuration.
   * @returns The resolver function.
   */
  public createBlockResolver(field: ExtendedCMSField) {
    return async (parent: Record<string, unknown>): Promise<unknown> => {
      const draft = parent._draft as Record<string, unknown> | null
      const val =
        draft && draft[field.slug] !== undefined
          ? draft[field.slug]
          : parent[field.slug]

      const parsed = [
        "tags",
        "json",
        "seo_metadata",
        "modular_content",
        "structured_text",
        "navigation",
        "standings_table",
      ].includes(field.field_type)
        ? this.parseJsonValue(val)
        : val

      const isDeepResolvable =
        [
          "standings_table",
          "json",
          "modular_content",
          "structured_text",
        ].includes(field.field_type) || field.slug === "league_standings"

      if (isDeepResolvable && parsed) {
        return this.resolveNode(parsed)
      }

      return parsed
    }
  }

  /**
   * Recursively traverses a node to resolve nested content, references, and media.
   * @param node - The object or value to resolve.
   * @param depth - Current recursion depth.
   * @param visited - Set of visited node IDs to check for circular dependency.
   * @returns The resolved node.
   */
  public async resolveNode(
    node: unknown,
    depth = 0,
    visited = new Set<string>()
  ): Promise<unknown> {
    const MAX_DEPTH = 3
    if (!node || typeof node !== "object" || depth > MAX_DEPTH) return node

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeAny = node as any

    if (nodeAny.id && typeof nodeAny.id === "string") {
      if (visited.has(nodeAny.id)) return node
      visited.add(nodeAny.id)
    }

    if (Array.isArray(node)) {
      return Promise.all(
        node.map(async (item) => {
          return this.resolveNode(item, depth + 1, new Set(visited))
        })
      )
    }

    const updatedNode = { ...nodeAny }

    // 1. Handle cmsBlock in Structured Text
    if (nodeAny.type === "cmsBlock" && nodeAny.attrs && nodeAny.attrs.data) {
      updatedNode.attrs.data = await this.resolveNode(
        nodeAny.attrs.data,
        depth + 1,
        visited
      )
    }

    // 2. Resolve explicit team_logo object (Standings Table)
    if (nodeAny.team_logo && typeof nodeAny.team_logo === "object") {
      const logoObj = nodeAny.team_logo as Record<string, unknown>
      const assetId = logoObj.id as string
      if (assetId) {
        const { data: mediaData } = await this.supabase
          .from("media_assets")
          .select("*")
          .eq("id", assetId)
          .single()
        if (mediaData) {
          updatedNode.team_logo = mediaData
        }
      }
    }

    // 3. Resolve team details (Standings Table)
    if (nodeAny.team_id && typeof nodeAny.team_id === "string") {
      const { data: teamData } = await this.supabase
        .from("teams")
        .select("*")
        .eq("id", nodeAny.team_id)
        .single()

      if (teamData) {
        Object.assign(updatedNode, teamData)
        const teamLogoId = teamData.logo || teamData.team_logo
        if (
          teamLogoId &&
          (!updatedNode.team_logo || typeof updatedNode.team_logo !== "object")
        ) {
          const { data: mediaData } = await this.supabase
            .from("media_assets")
            .select("*")
            .eq("id", teamLogoId)
            .single()
          if (mediaData) {
            updatedNode.team_logo = mediaData
          }
        }
      }
    }

    // 4. Resolve UUID strings that represent references
    for (const key of Object.keys(updatedNode)) {
      const val = updatedNode[key]
      const isUuid = function (s: unknown) {
        return (
          typeof s === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            s
          )
        )
      }

      const potentialIds = Array.isArray(val) ? val : [val]

      if (potentialIds.every(isUuid)) {
        const idArray = potentialIds as string[]

        for (const model of this.validModels) {
          if (
            ["models", "fields", "groups", "media_assets"].includes(
              model.table_name
            )
          )
            continue

          const { data: matched } = await this.supabase
            .from(model.table_name)
            .select("*")
            .in("id", idArray)

          if (matched && matched.length > 0) {
            const dataMap = new Map(
              (matched as Record<string, unknown>[]).map((m) => {
                return [m.id as string, m]
              })
            )
            const resolvedResults = await Promise.all(
              idArray.map(async (id) => {
                const item = dataMap.get(id)
                return item
                  ? await this.resolveNode(item, depth + 1, new Set(visited))
                  : id
              })
            )

            updatedNode[key] = Array.isArray(val)
              ? resolvedResults
              : resolvedResults[0]
            break
          }
        }
      }
    }

    // Recursively resolve other properties
    for (const key of Object.keys(updatedNode)) {
      if (
        key !== "team_logo" &&
        key !== "team_id" &&
        key !== "attrs" &&
        typeof updatedNode[key] === "object"
      ) {
        updatedNode[key] = await this.resolveNode(
          updatedNode[key],
          depth + 1,
          new Set(visited)
        )
      }
    }

    return updatedNode
  }
}
