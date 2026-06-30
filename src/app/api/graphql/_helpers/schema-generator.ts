import {
  GraphQLBoolean,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  Kind,
} from "graphql"
import { createClient } from "@supabase/supabase-js"

import { CMSField } from "@/types/fields"

/**
 * Extended CMSField to include metadata used for relations
 */
interface ExtendedCMSField extends CMSField {
  validation_rules?: {
    linkedModel?: string
    [key: string]: unknown
  }
}

interface CMSModel {
  id: string
  model_id: string
  model_name: string
  friendly_name: string
  table_name: string
  has_draft_mode?: boolean
  [key: string]: unknown
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GraphQLJSON = new GraphQLScalarType({
  name: "JSON",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING || ast.kind === Kind.BOOLEAN) return ast.value
    if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT)
      return parseFloat(ast.value)
    if (ast.kind === Kind.OBJECT) {
      const value = Object.create(null)
      ast.fields.forEach((field) => {
        value[field.name.value] = field.value
      })
      return value
    }
    if (ast.kind === Kind.LIST) return ast.values.map((val) => val)
    return null
  },
})

const MediaType = new GraphQLObjectType({
  name: "Media",
  fields: {
    id: { type: GraphQLString },
    url: { type: GraphQLString },
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    size: { type: GraphQLInt },
    width: { type: GraphQLInt },
    height: { type: GraphQLInt },
    alt_text: { type: GraphQLString },
    folder: { type: GraphQLString },
    tags: { type: new GraphQLList(GraphQLString) },
  },
})

export const generateSchema = async () => {
  console.log("GraphQL: Starting schema generation...")

  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("*")
  const { data: fields, error: fieldsError } = await supabase
    .from("fields")
    .select("*")

  if (modelsError) console.error("GraphQL: Models fetch error", modelsError)
  if (fieldsError) console.error("GraphQL: Fields fetch error", fieldsError)

  const types: Record<string, GraphQLObjectType> = {}
  const filterInputTypes: Record<string, GraphQLInputObjectType> = {}
  const validModels = ((models as CMSModel[] | null) || []).filter(
    (m) => (m.friendly_name || m.model_name) && m.table_name
  )

  console.log(
    `GraphQL: Found ${models?.length || 0} models and ${fields?.length || 0} fields.`
  )

  const getGraphQLType = (field: CMSField, isInput = false) => {
    switch (field.field_type) {
      case "number":
        return GraphQLInt
      case "boolean":
        return GraphQLBoolean
      case "media":
        if (isInput) return GraphQLString
        return field.settings?.allow_multiple
          ? new GraphQLList(MediaType)
          : MediaType
      case "tags":
      case "json":
      case "seo_metadata":
      case "modular_content":
      case "structured_text":
      case "navigation":
      case "standings_table":
        return GraphQLJSON
      case "select":
        return GraphQLString
      default:
        return GraphQLString
    }
  }

  const parseJsonValue = (val: unknown) => {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val)
        // If it's the literal null (from string "null"), return literal null
        return parsed
      } catch {
        return val
      }
    }
    return val
  }

  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
      .replace(/^[0-9]/, "M_")
  }

  // 1. Pass: Create Filter Input Types First (to support recursion/references)
  validModels.forEach((model) => {
    const typeName = toPascalCase(model.friendly_name || model.table_name)
    filterInputTypes[model.id] = new GraphQLInputObjectType({
      name: `${typeName}FilterInput`,
      fields: () => {
        const modelFields = (
          (fields as ExtendedCMSField[] | null) || []
        ).filter((f) => f.model_id === model.id)
        const filterFields: GraphQLInputFieldConfigMap = {
          id: { type: GraphQLString },
          created_at: { type: GraphQLString },
          updated_at: { type: GraphQLString },
        }

        modelFields.forEach((field) => {
          if (field.field_type === "reference") {
            const allowedIds =
              (field.settings?.allowed_models as string[]) || []
            const linkedModelId =
              allowedIds.find((id) => filterInputTypes[id]) ||
              field.validation_rules?.linkedModel ||
              (field.settings?.linkedModel as string)

            const linkedFilterType = filterInputTypes[linkedModelId || ""]
            if (linkedFilterType) {
              filterFields[field.slug] = { type: linkedFilterType }
            } else {
              filterFields[field.slug] = { type: GraphQLString }
            }
          } else {
            const inputType = getGraphQLType(field, true)
            // Ensure only valid Input types are used
            if (
              inputType instanceof GraphQLScalarType ||
              inputType instanceof GraphQLInputObjectType
            ) {
              filterFields[field.slug] = { type: inputType }
            } else if (inputType instanceof GraphQLList) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              filterFields[field.slug] = { type: inputType as any }
            } else {
              filterFields[field.slug] = { type: GraphQLString }
            }
          }
        })
        return filterFields
      },
    })
  })

  // 2. Pass: Create Object Types
  validModels.forEach((model) => {
    try {
      const typeName = toPascalCase(model.friendly_name || model.table_name)
      types[model.id] = new GraphQLObjectType({
        name: typeName,
        fields: () => {
          const modelFields = (
            (fields as ExtendedCMSField[] | null) || []
          ).filter((f) => f.model_id === model.id)
          const fieldsConfig: GraphQLFieldConfigMap<
            Record<string, unknown>,
            unknown
          > = {
            id: { type: GraphQLString },
            created_at: { type: GraphQLString },
            updated_at: { type: GraphQLString },
          }

          modelFields.forEach((field) => {
            if (field.field_type === "reference") {
              const allowedIds =
                (field.settings?.allowed_models as string[]) || []
              const linkedModelId =
                allowedIds.find((id) => types[id]) ||
                field.validation_rules?.linkedModel ||
                (field.settings?.linkedModel as string)

              const linkedModel = validModels.find(
                (m) => m.id === linkedModelId
              )
              const linkedType = types[linkedModelId || ""]

              if (linkedType && linkedModel) {
                const isMultiple = field.settings?.allow_multiple === true
                fieldsConfig[field.slug] = {
                  type: isMultiple ? new GraphQLList(linkedType) : linkedType,
                  resolve: async (parent: Record<string, unknown>) => {
                    const rawValue = parent[field.slug]
                    if (!rawValue) return isMultiple ? [] : null

                    const ids = parseJsonValue(rawValue)
                    const idArray = Array.isArray(ids)
                      ? (ids as string[])
                      : [ids as string]
                    if (idArray.length === 0 || !idArray[0])
                      return isMultiple ? [] : null

                    const { data } = await supabase
                      .from(linkedModel.table_name)
                      .select("*")
                      .in("id", idArray)

                    const dataMap = new Map(
                      ((data as Record<string, unknown>[] | null) || []).map(
                        (item) => [item.id as string, item]
                      )
                    )
                    const results = idArray
                      .map((id) => dataMap.get(id))
                      .filter(Boolean)

                    return isMultiple ? results : results[0] || null
                  },
                }
              } else {
                fieldsConfig[field.slug] = { type: GraphQLString }
              }
            } else if (field.field_type === "media") {
              fieldsConfig[field.slug] = {
                type: getGraphQLType(field),
                resolve: async (parent: Record<string, unknown>) => {
                  const draft = parent._draft as Record<string, unknown> | null
                  const val =
                    draft && draft[field.slug] !== undefined
                      ? draft[field.slug]
                      : parent[field.slug]

                  const parsedValue = parseJsonValue(val)
                  if (!parsedValue) return null

                  const isMultiple = field.settings?.allow_multiple === true
                  const assets = Array.isArray(parsedValue)
                    ? parsedValue
                    : [parsedValue]

                  const assetIds = assets
                    .map((a) => (typeof a === "string" ? a : a?.id))
                    .filter(Boolean) as string[]

                  if (assetIds.length > 0) {
                    const { data: mediaData } = await supabase
                      .from("media_assets")
                      .select("*")
                      .in("id", assetIds)

                    if (mediaData && mediaData.length > 0) {
                      const dataMap = new Map(mediaData.map((m) => [m.id, m]))
                      const results = assetIds
                        .map((id) => dataMap.get(id))
                        .filter(Boolean)
                      return isMultiple ? results : results[0] || null
                    }
                  }
                  return isMultiple ? assets : assets[0] || null
                },
              }
            } else {
              fieldsConfig[field.slug] = {
                type: getGraphQLType(field),
                resolve: async (parent: Record<string, unknown>) => {
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
                    ? parseJsonValue(val)
                    : val

                  // Deep resolve media objects within complex JSON structures
                  const isDeepResolvable =
                    field.field_type === "standings_table" ||
                    field.field_type === "json" ||
                    field.field_type === "modular_content" ||
                    field.field_type === "structured_text" ||
                    field.slug === "league_standings"

                  if (isDeepResolvable && parsed) {
                    const MAX_DEPTH = 3
                    const resolveNode = async (
                      node: unknown,
                      depth = 0,
                      visited = new Set<string>()
                    ): Promise<unknown> => {
                      if (
                        !node ||
                        typeof node !== "object" ||
                        depth > MAX_DEPTH
                      )
                        return node

                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const nodeAny = node as any

                      // Prevent circular references if the node has an ID
                      if (nodeAny.id && typeof nodeAny.id === "string") {
                        if (visited.has(nodeAny.id)) return node
                        visited.add(nodeAny.id)
                      }

                      // Handle arrays
                      if (Array.isArray(node)) {
                        return Promise.all(
                          node.map((item) =>
                            resolveNode(item, depth + 1, visited)
                          )
                        )
                      }

                      const updatedNode = { ...nodeAny }

                      // 1. Handle cmsBlock in Structured Text
                      if (
                        nodeAny.type === "cmsBlock" &&
                        nodeAny.attrs &&
                        nodeAny.attrs.data
                      ) {
                        // Recursively resolve data within the block's attributes
                        updatedNode.attrs.data = await resolveNode(
                          nodeAny.attrs.data,
                          depth + 1,
                          visited
                        )
                      }

                      // 2. Resolve explicit team_logo object if it exists (Standings Table)
                      if (
                        nodeAny.team_logo &&
                        typeof nodeAny.team_logo === "object"
                      ) {
                        const logoObj = nodeAny.team_logo as Record<
                          string,
                          unknown
                        >
                        const assetId = logoObj.id as string
                        if (assetId) {
                          const { data: mediaData } = await supabase
                            .from("media_assets")
                            .select("*")
                            .eq("id", assetId)
                            .single()
                          if (mediaData) {
                            updatedNode.team_logo = mediaData
                          }
                        }
                      }

                      // 3. Resolve team details (logo, etc) from team_id if missing (Standings Table)
                      if (
                        nodeAny.team_id &&
                        typeof nodeAny.team_id === "string"
                      ) {
                        const { data: teamData } = await supabase
                          .from("teams")
                          .select("*")
                          .eq("id", nodeAny.team_id)
                          .single()

                        if (teamData) {
                          Object.assign(updatedNode, teamData)

                          const teamLogoId = teamData.logo || teamData.team_logo
                          if (
                            teamLogoId &&
                            (!updatedNode.team_logo ||
                              typeof updatedNode.team_logo !== "object")
                          ) {
                            const { data: mediaData } = await supabase
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

                        // If it's a UUID string or an array of UUID strings
                        const isUuid = (s: unknown) =>
                          typeof s === "string" &&
                          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                            s
                          )

                        const potentialIds = Array.isArray(val) ? val : [val]

                        if (potentialIds.every(isUuid)) {
                          // It's a potential reference. We need to find which model it belongs to.
                          // This is expensive as we have to check multiple tables if we don't know the model.
                          // However, we can use the 'models' we already fetched to try and find it.
                          const idArray = potentialIds as string[]

                          // Strategy: Try to find which table these IDs belong to
                          // We only check models that are likely to be referenced
                          for (const model of validModels) {
                            if (
                              [
                                "models",
                                "fields",
                                "groups",
                                "media_assets",
                              ].includes(model.table_name)
                            )
                              continue

                            const { data: matched } = await supabase
                              .from(model.table_name)
                              .select("*")
                              .in("id", idArray)

                            if (matched && matched.length > 0) {
                              const dataMap = new Map(
                                (matched as Record<string, unknown>[]).map(
                                  (m) => [m.id as string, m]
                                )
                              )
                              const resolvedResults = await Promise.all(
                                idArray.map(async (id) => {
                                  const item = dataMap.get(id)
                                  return item
                                    ? await resolveNode(
                                        item,
                                        depth + 1,
                                        new Set(visited)
                                      )
                                    : id
                                })
                              )

                              updatedNode[key] = Array.isArray(val)
                                ? resolvedResults
                                : resolvedResults[0]
                              break // Found the model, stop looking
                            }
                          }
                        }
                      }

                      // Recursively resolve other properties
                      for (const key of Object.keys(updatedNode)) {
                        if (
                          key !== "team_logo" &&
                          key !== "team_id" &&
                          key !== "attrs" && // Skip attrs as we handled it above
                          typeof updatedNode[key] === "object"
                        ) {
                          updatedNode[key] = await resolveNode(
                            updatedNode[key],
                            depth + 1,
                            visited
                          )
                        }
                      }

                      return updatedNode
                    }

                    return resolveNode(parsed)
                  }

                  return parsed
                },
              }
            }
          })
          return fieldsConfig
        },
      })
    } catch (err) {
      console.error(
        `GraphQL: Failed to create type for ${model.friendly_name || model.table_name}`,
        err
      )
    }
  })

  const QueryType = new GraphQLObjectType({
    name: "Query",
    fields: () => {
      const queryFields: GraphQLFieldConfigMap<unknown, unknown> = {
        _heartbeat: { type: GraphQLString, resolve: () => "CMS API is online" },
      }

      validModels.forEach((model) => {
        const modelType = types[model.id]
        if (!modelType) return

        const technicalName = model.table_name || model.model_id
        const filterType = filterInputTypes[model.id]

        queryFields[technicalName] = {
          type: modelType,
          args: {
            id: { type: new GraphQLNonNull(GraphQLString) },
            preview: { type: GraphQLBoolean, defaultValue: false },
          },
          resolve: async (_source, { id, preview }) => {
            let query = supabase.from(model.table_name).select("*").eq("id", id)
            if (model.has_draft_mode && !preview) {
              query = query.eq("status", "published")
            }
            const { data } = await query.single()
            if (!data) return null
            return !preview ? { ...data, _draft: null } : data
          },
        }

        queryFields[`${technicalName}Collection`] = {
          type: new GraphQLObjectType({
            name: `${modelType.name}Connection`,
            fields: {
              edges: {
                type: new GraphQLList(
                  new GraphQLObjectType({
                    name: `${modelType.name}Edge`,
                    fields: { node: { type: modelType } },
                  })
                ),
                resolve: (parent: unknown[]) =>
                  (parent || []).map((node) => ({ node })),
              },
            },
          }),
          args: {
            preview: { type: GraphQLBoolean, defaultValue: false },
            includeDrafts: { type: GraphQLBoolean, defaultValue: false },
            where: { type: filterType },
          },
          resolve: async (_source, { preview, includeDrafts, where }) => {
            /**
             * Helper to apply filters to a Supabase query builder.
             * Bypasses relationship errors by fetching matching IDs from linked tables first.
             */
            const applyFilters = async (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              queryBuilder: any,
              currentWhere: Record<string, unknown> | null | undefined,
              currentModel: CMSModel,
              isSubQuery = false
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ): Promise<{ query: any }> => {
              if (!currentWhere || Object.keys(currentWhere).length === 0)
                return { query: queryBuilder }
              let localQuery = queryBuilder

              // IMPORTANT: Process reference filters sequentially to avoid concurrent query builder state mutation
              for (const key of Object.keys(currentWhere)) {
                const val = currentWhere[key]
                const field = (
                  (fields as ExtendedCMSField[] | null) || []
                ).find(
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

                  // Special Case: Direct ID filter
                  if (
                    Object.keys(valObj).length === 1 &&
                    valObj.id &&
                    typeof valObj.id === "string"
                  ) {
                    // Quoted UUID for JSONB reference columns (main table),
                    // but raw UUID for string/uuid columns (sub-query / normal tables)
                    if (!isSubQuery) {
                      localQuery = localQuery.filter(
                        key,
                        "eq",
                        `"${valObj.id}"`
                      )
                    } else {
                      localQuery = localQuery.eq(key, valObj.id)
                    }
                    continue
                  }

                  // Complex Case: Nested filter (e.g., slug, year)
                  // 1. Find the linked model
                  const allowedIds =
                    (field.settings?.allowed_models as string[]) || []
                  const linkedModelId =
                    allowedIds[0] ||
                    field.validation_rules?.linkedModel ||
                    (field.settings?.linkedModel as string)
                  const linkedModel = validModels.find(
                    (m) => m.id === linkedModelId
                  )

                  if (linkedModel) {
                    // 2. Build and execute a sub-query to find matching IDs in the linked table
                    const subQuery = supabase
                      .from(linkedModel.table_name)
                      .select("id")

                    // Recursive call to apply filters to the sub-query
                    // isSubQuery = true ensures we use standard .eq() for non-JSONB columns
                    const { query: filteredSubQuery } = await applyFilters(
                      subQuery,
                      valObj,
                      linkedModel,
                      true
                    )

                    const { data: matchedRecords } =
                      await (filteredSubQuery as {
                        data: { id: string }[] | null
                      })
                    const matchedIds = (matchedRecords || []).map(
                      (r) => `"${r.id}"`
                    )

                    if (matchedIds.length === 0) {
                      // No matches in the linked table means no possible matches in the main table
                      localQuery = localQuery.filter(
                        key,
                        "eq",
                        '"00000000-0000-0000-0000-000000000000"'
                      )
                    } else if (matchedIds.length === 1) {
                      // Single match - use standard eq for JSONB
                      localQuery = localQuery.filter(key, "eq", matchedIds[0])
                    } else {
                      // 3. Filter the main query where the reference column is in the matched IDs list.
                      // For JSONB columns, PostgREST doesn't support the 'in' operator with quoted JSON values well in all versions.
                      // Using multiple .eq() inside an .or() is more reliable for JSONB string equality.
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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const queryBuilder: any = supabase
              .from(model.table_name)
              .select("*", { count: "exact" })

            // Apply filters (now async)
            const { query: filteredQuery } = await applyFilters(
              queryBuilder,
              where,
              model,
              false
            )

            let finalQuery = filteredQuery
            if (model.has_draft_mode && !includeDrafts && !preview) {
              finalQuery = finalQuery.eq("status", "published")
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (finalQuery as any)
            if (error) {
              console.error("GraphQL Query Error:", error)
              throw new Error(error.message)
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const results = (data as any[] | null) ?? []
            return !preview
              ? results.map((item) => ({ ...item, _draft: null }))
              : results
          },
        }
      })
      return queryFields
    },
  })

  const SiteSettingsType = new GraphQLObjectType({
    name: "SiteSettings",
    fields: {
      defaultPageTitle: { type: GraphQLString },
      titleSuffix: { type: GraphQLString },
      fallbackDescription: { type: GraphQLString },
      noIndex: { type: GraphQLBoolean },
      socialSiteName: { type: GraphQLString },
      twitterHandle: { type: GraphQLString },
      twitterUrl: { type: GraphQLString },
      socialCard: { type: MediaType },
      facebookUrl: { type: GraphQLString },
      instagramUrl: { type: GraphQLString },
      siteUrl: { type: GraphQLString },
      favicon: { type: MediaType },
    },
  })

  const schemaFields: GraphQLFieldConfigMap<unknown, unknown> = {
    ...QueryType.toConfig().fields,
    siteSettings: {
      type: SiteSettingsType,
      resolve: async () => {
        const { data } = await supabase
          .from("globals")
          .select("value")
          .eq("key", "site_settings")
          .single()

        if (!data?.value) return null

        const settings = data.value as Record<string, unknown>

        // Resolve social card if it exists
        if (settings.socialCard && typeof settings.socialCard === "string") {
          const { data: mediaData } = await supabase
            .from("media_assets")
            .select("*")
            .eq("id", settings.socialCard)
            .single()
          settings.socialCard = mediaData
        }

        // Resolve favicon if it exists
        if (settings.favicon && typeof settings.favicon === "string") {
          const { data: mediaData } = await supabase
            .from("media_assets")
            .select("*")
            .eq("id", settings.favicon)
            .single()
          settings.favicon = mediaData
        }

        return settings
      },
    },
  }

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: schemaFields,
    }),
  })
}
