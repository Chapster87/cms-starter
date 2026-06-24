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
        return JSON.parse(val)
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
              filterFields[field.field_name] = { type: linkedFilterType }
            } else {
              filterFields[field.field_name] = { type: GraphQLString }
            }
          } else {
            const inputType = getGraphQLType(field, true)
            // Ensure only valid Input types are used
            if (
              inputType instanceof GraphQLScalarType ||
              inputType instanceof GraphQLInputObjectType
            ) {
              filterFields[field.field_name] = { type: inputType }
            } else if (inputType instanceof GraphQLList) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              filterFields[field.field_name] = { type: inputType as any }
            } else {
              filterFields[field.field_name] = { type: GraphQLString }
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
                fieldsConfig[field.field_name] = {
                  type: isMultiple ? new GraphQLList(linkedType) : linkedType,
                  resolve: async (parent: Record<string, unknown>) => {
                    const rawValue = parent[field.field_name]
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
                fieldsConfig[field.field_name] = { type: GraphQLString }
              }
            } else if (field.field_type === "media") {
              fieldsConfig[field.field_name] = {
                type: getGraphQLType(field),
                resolve: async (parent: Record<string, unknown>) => {
                  const draft = parent._draft as Record<string, unknown> | null
                  const val =
                    draft && draft[field.field_name] !== undefined
                      ? draft[field.field_name]
                      : parent[field.field_name]

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
              fieldsConfig[field.field_name] = {
                type: getGraphQLType(field),
                resolve: (parent: Record<string, unknown>) => {
                  const draft = parent._draft as Record<string, unknown> | null
                  const val =
                    draft && draft[field.field_name] !== undefined
                      ? draft[field.field_name]
                      : parent[field.field_name]

                  const parsed = [
                    "tags",
                    "json",
                    "seo_metadata",
                    "modular_content",
                    "navigation",
                    "standings_table",
                  ].includes(field.field_type)
                    ? parseJsonValue(val)
                    : val

                  // Deep resolve media objects within complex JSON structures (like standings tables)
                  const isDeepResolvable =
                    field.field_type === "standings_table" ||
                    field.field_type === "json" ||
                    field.field_type === "modular_content" ||
                    field.field_name === "league_standings"

                  if (isDeepResolvable && Array.isArray(parsed)) {
                    return Promise.all(
                      parsed.map(async (row: Record<string, unknown>) => {
                        let updatedRow = { ...row }

                        // 1. Resolve explicit team_logo object if it exists
                        if (
                          row.team_logo &&
                          typeof row.team_logo === "object"
                        ) {
                          const logoObj = row.team_logo as Record<
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
                              updatedRow.team_logo = mediaData
                            }
                          }
                        }

                        // 2. Resolve team details (logo, etc) from team_id if missing
                        if (row.team_id && typeof row.team_id === "string") {
                          const { data: teamData } = await supabase
                            .from("teams")
                            .select("*")
                            .eq("id", row.team_id)
                            .single()

                          if (teamData) {
                            // Merge team data into the row (e.g. logo, short_name)
                            // We prefer the existing row data if it exists
                            updatedRow = {
                              ...teamData,
                              ...updatedRow,
                            }

                            // If team has a logo ID, resolve it to full media
                            const teamLogoId =
                              teamData.logo || teamData.team_logo
                            if (
                              teamLogoId &&
                              (!updatedRow.team_logo ||
                                typeof updatedRow.team_logo !== "object")
                            ) {
                              const { data: mediaData } = await supabase
                                .from("media_assets")
                                .select("*")
                                .eq("id", teamLogoId)
                                .single()
                              if (mediaData) {
                                updatedRow.team_logo = mediaData
                              }
                            }
                          }
                        }

                        return updatedRow
                      })
                    )
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
            ): Promise<any> => {
              if (!currentWhere) return queryBuilder
              let localQuery = queryBuilder

              for (const key of Object.keys(currentWhere)) {
                const val = currentWhere[key]
                const field = (
                  (fields as ExtendedCMSField[] | null) || []
                ).find(
                  (f) =>
                    f.model_id === (currentModel.id || currentModel.model_id) &&
                    f.field_name === key
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
                    let subQuery = supabase
                      .from(linkedModel.table_name)
                      .select("id")

                    // Recursive call to apply filters to the sub-query
                    // isSubQuery = true ensures we use standard .eq() for non-JSONB columns
                    subQuery = await applyFilters(
                      subQuery,
                      valObj,
                      linkedModel,
                      true
                    )

                    const { data: matchedRecords } = await subQuery
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
                        .map((id) => `${key}.eq.${id}`)
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
              return localQuery
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let queryBuilder: any = supabase
              .from(model.table_name)
              .select("*", { count: "exact" })

            // Apply filters (now async)
            queryBuilder = await applyFilters(queryBuilder, where, model, false)

            if (model.has_draft_mode && !includeDrafts && !preview) {
              queryBuilder = queryBuilder.eq("status", "published")
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (queryBuilder as any)
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
