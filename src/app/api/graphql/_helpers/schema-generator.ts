import {
  GraphQLBoolean,
  GraphQLFieldConfigMap,
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
    url: { type: GraphQLString },
    name: { type: GraphQLString },
    type: { type: GraphQLString },
    size: { type: GraphQLInt },
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
  const validModels = ((models as CMSModel[] | null) || []).filter(
    (m) => (m.friendly_name || m.model_name) && m.table_name
  )

  console.log(
    `GraphQL: Found ${models?.length || 0} models and ${fields?.length || 0} fields.`
  )

  const getGraphQLType = (field: CMSField) => {
    switch (field.field_type) {
      case "number":
        return GraphQLInt
      case "boolean":
        return GraphQLBoolean
      case "media":
        return field.settings?.allow_multiple
          ? new GraphQLList(MediaType)
          : MediaType
      case "tags":
      case "json":
      case "seo_metadata":
      case "modular_content":
      case "navigation":
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

  /**
   * Helper to convert strings to PascalCase for GraphQL types
   */
  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
      .replace(/^[0-9]/, "M_")
  }

  // 1. Pass: Create Object Types
  validModels.forEach((model) => {
    try {
      // Use PascalCase for cleaner type names (e.g., SocialLinks)
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
                resolve: (parent: Record<string, unknown>) =>
                  parseJsonValue(parent[field.field_name]),
              }
            } else {
              fieldsConfig[field.field_name] = {
                type: getGraphQLType(field),
                resolve: (parent: Record<string, unknown>) => {
                  const val = parent[field.field_name]
                  return [
                    "tags",
                    "json",
                    "seo_metadata",
                    "modular_content",
                    "navigation",
                  ].includes(field.field_type)
                    ? parseJsonValue(val)
                    : val
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

  // 2. Build Root Query
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

        queryFields[technicalName] = {
          type: modelType,
          args: { id: { type: new GraphQLNonNull(GraphQLString) } },
          resolve: async (_source, { id }) => {
            const { data } = await supabase
              .from(model.table_name)
              .select("*")
              .eq("id", id)
              .single()
            return data
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
          resolve: async () => {
            const { data } = await supabase.from(model.table_name).select("*")
            return data
          },
        }
      })

      return queryFields
    },
  })

  return new GraphQLSchema({ query: QueryType })
}
