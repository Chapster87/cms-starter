import {
  GraphQLBoolean,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
  Kind,
} from "graphql"
import { SupabaseClient } from "@supabase/supabase-js"

import { CMSBlock, CMSField } from "@/types/fields"
import { CMSModel, ExtendedCMSField, ResolverFactory } from "./ResolverFactory"

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

export class CDACore {
  private supabase: SupabaseClient
  private models: CMSModel[] = []
  private fields: ExtendedCMSField[] = []
  private blocks: CMSBlock[] = []
  private types: Record<string, GraphQLObjectType> = {}
  private blockTypes: Record<string, GraphQLObjectType> = {}
  private blockUnionType: GraphQLUnionType | null = null
  private structuredTextType: GraphQLObjectType | null = null
  private filterInputTypes: Record<string, GraphQLInputObjectType> = {}
  private resolverFactory!: ResolverFactory

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Generates the complete GraphQL schema for the CDA.
   */
  public async generateSchema(): Promise<GraphQLSchema> {
    console.log("CDACore: Starting schema generation...")

    await this.fetchMetadata()

    const validModels = this.models.filter(
      (m) => (m.friendly_name || m.model_name) && m.table_name
    )

    this.resolverFactory = new ResolverFactory(this.supabase, validModels)

    console.log(
      `CDACore: Found ${this.models.length} models, ${this.fields.length} fields, and ${this.blocks.length} blocks.`
    )

    // 1. Pass: Create Block Object Types
    this.generateBlockTypes(validModels)

    // 1b. Pass: Create Block Union Type
    this.generateBlockUnionType()

    // 1c. Pass: Create Structured Text Type
    this.generateStructuredTextType()

    // 2. Pass: Create Filter Input Types
    this.generateFilterInputTypes(validModels)

    // 3. Pass: Create Model Object Types
    this.generateModelObjectTypes(validModels)

    // 4. Pass: Build Query Type
    const QueryType = this.generateQueryType(validModels)

    // 5. Pass: Final Schema with Global Settings
    const schema = this.generateFinalSchema(QueryType)

    // Add block types to the schema so they are discoverable even if not yet used in fields
    // Add block types to the schema so they are discoverable even if not yet used in fields
    const config = schema.toConfig()
    const extraTypes: GraphQLNamedType[] = [...Object.values(this.blockTypes)]
    if (this.blockUnionType) {
      extraTypes.push(this.blockUnionType)
    }
    if (this.structuredTextType) {
      extraTypes.push(this.structuredTextType)
    }

    return new GraphQLSchema({
      ...config,
      types: [...(config.types || []), ...extraTypes],
    })
  }

  private async fetchMetadata() {
    const [modelsRes, fieldsRes, blocksRes] = await Promise.all([
      this.supabase.from("models").select("*"),
      this.supabase.from("fields").select("*"),
      this.supabase.from("blocks").select("*"),
    ])

    if (modelsRes.error)
      console.error("CDACore: Models fetch error", modelsRes.error)
    if (fieldsRes.error)
      console.error("CDACore: Fields fetch error", fieldsRes.error)
    if (blocksRes.error)
      console.error("CDACore: Blocks fetch error", blocksRes.error)

    this.models = (modelsRes.data as CMSModel[]) || []
    this.fields = (fieldsRes.data as ExtendedCMSField[]) || []
    this.blocks = (blocksRes.data as CMSBlock[]) || []
  }

  private generateBlockUnionType() {
    const types = Object.values(this.blockTypes)
    if (types.length === 0) return

    this.blockUnionType = new GraphQLUnionType({
      name: "BlockUnion",
      types: types,
      resolveType: (value) => {
        const blockApiId =
          value._block_type ||
          value._type ||
          value.type ||
          value.block_type ||
          value.blockType ||
          value.api_id
        const block = this.blocks.find(
          (b) => b.api_id === blockApiId || b.id === value._block_id
        )
        if (block) {
          return this.toPascalCase(block.label) + "Block"
        }
        return undefined
      },
    })
  }

  private generateStructuredTextType() {
    if (!this.blockUnionType) return

    this.structuredTextType = new GraphQLObjectType({
      name: "StructuredText",
      fields: {
        value: { type: GraphQLJSON },
        blocks: {
          type: new GraphQLList(this.blockUnionType),
          resolve: (parent) => {
            const blocks: Record<string, unknown>[] = []
            const findBlocks = (node: unknown) => {
              if (!node || typeof node !== "object") return
              const nodeObj = node as Record<string, unknown>
              if (nodeObj.type === "cmsBlock" && nodeObj.attrs) {
                const attrs = nodeObj.attrs as Record<string, unknown>
                if (attrs.data) {
                  blocks.push({
                    ...(attrs.data as Record<string, unknown>),
                    _block_type: (attrs.blockType ||
                      attrs.block_type) as string,
                    _block_id: (attrs.blockId || attrs.block_id) as string,
                  })
                }
              }
              if (Array.isArray(node)) {
                node.forEach(findBlocks)
              } else {
                Object.values(nodeObj).forEach(findBlocks)
              }
            }
            findBlocks(parent)
            return blocks
          },
        },
      },
    })
  }

  private generateBlockTypes(validModels: CMSModel[]) {
    this.blocks.forEach((block) => {
      const typeName = this.toPascalCase(block.label) + "Block"
      const blockFields = this.fields.filter((f) => f.block_id === block.id)

      this.blockTypes[block.id] = new GraphQLObjectType({
        name: typeName,
        fields: () => {
          const fieldsConfig: GraphQLFieldConfigMap<
            Record<string, unknown>,
            unknown
          > = {
            _block_type: { type: GraphQLString, resolve: () => block.api_id },
          }

          blockFields.forEach((field) => {
            if (field.field_type === "reference") {
              this.addReferenceField(fieldsConfig, field, validModels)
            } else if (field.field_type === "media") {
              this.addMediaField(fieldsConfig, field)
            } else {
              this.addStandardField(fieldsConfig, field, validModels)
            }
          })

          return fieldsConfig
        },
      })
    })
  }

  private generateFilterInputTypes(validModels: CMSModel[]) {
    validModels.forEach((model) => {
      const typeName = this.toPascalCase(
        model.friendly_name || model.table_name
      )
      this.filterInputTypes[model.id] = new GraphQLInputObjectType({
        name: `${typeName}FilterInput`,
        fields: () => {
          const modelFields = this.fields.filter((f) => f.model_id === model.id)
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
                allowedIds.find((id) => this.filterInputTypes[id]) ||
                field.validation_rules?.linkedModel ||
                (field.settings?.linkedModel as string)

              const linkedFilterType =
                this.filterInputTypes[linkedModelId || ""]
              if (linkedFilterType) {
                filterFields[field.slug] = { type: linkedFilterType }
              } else {
                filterFields[field.slug] = { type: GraphQLString }
              }
            } else {
              const inputType = this.getGraphQLType(field, true)
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
  }

  private generateModelObjectTypes(validModels: CMSModel[]) {
    validModels.forEach((model) => {
      try {
        const typeName = this.toPascalCase(
          model.friendly_name || model.table_name
        )
        this.types[model.id] = new GraphQLObjectType({
          name: typeName,
          fields: () => {
            const modelFields = this.fields.filter(
              (f) => f.model_id === model.id
            )
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
                this.addReferenceField(fieldsConfig, field, validModels)
              } else if (field.field_type === "media") {
                this.addMediaField(fieldsConfig, field)
              } else {
                this.addStandardField(fieldsConfig, field, validModels)
              }
            })
            return fieldsConfig
          },
        })
      } catch (err) {
        console.error(
          `CDACore: Failed to create type for ${model.friendly_name || model.table_name}`,
          err
        )
      }
    })
  }

  private addReferenceField(
    fieldsConfig: GraphQLFieldConfigMap<Record<string, unknown>, unknown>,
    field: ExtendedCMSField,
    validModels: CMSModel[]
  ) {
    const allowedIds = (field.settings?.allowed_models as string[]) || []
    const linkedModelId =
      allowedIds.find((id) => this.types[id]) ||
      field.validation_rules?.linkedModel ||
      (field.settings?.linkedModel as string)

    const linkedModel = validModels.find((m) => m.id === linkedModelId)
    const linkedType = this.types[linkedModelId || ""]

    if (linkedType && linkedModel) {
      const isMultiple = field.settings?.allow_multiple === true
      fieldsConfig[field.slug] = {
        type: isMultiple ? new GraphQLList(linkedType) : linkedType,
        resolve: this.resolverFactory.createReferenceResolver(field, linkedModel),
      }
    } else {
      fieldsConfig[field.slug] = { type: GraphQLString }
    }
  }

  private addMediaField(
    fieldsConfig: GraphQLFieldConfigMap<Record<string, unknown>, unknown>,
    field: ExtendedCMSField
  ) {
    fieldsConfig[field.slug] = {
      type: this.getGraphQLType(field),
      resolve: this.resolverFactory.createMediaResolver(field),
    }
  }

  private addStandardField(
    fieldsConfig: GraphQLFieldConfigMap<Record<string, unknown>, unknown>,
    field: ExtendedCMSField,
    validModels: CMSModel[]
  ) {
    fieldsConfig[field.slug] = {
      type: this.getGraphQLType(field),
      resolve: this.resolverFactory.createBlockResolver(field),
    }
  }

  private generateQueryType(validModels: CMSModel[]): GraphQLObjectType {
    return new GraphQLObjectType({
      name: "Query",
      fields: () => {
        const queryFields: GraphQLFieldConfigMap<unknown, unknown> = {
          _heartbeat: {
            type: GraphQLString,
            resolve: () => "CMS API is online",
          },
        }

        validModels.forEach((model) => {
          const modelType = this.types[model.id]
          if (!modelType) return

          const technicalName = model.table_name || model.model_id
          const filterType = this.filterInputTypes[model.id]

          queryFields[technicalName] = {
            type: modelType,
            args: {
              id: { type: GraphQLString },
              slug: { type: GraphQLString },
              preview: { type: GraphQLBoolean, defaultValue: false },
            },
            resolve: async (_source, { id, slug, preview }) => {
              if (!id && !slug && !model.is_singleton) {
                throw new Error(
                  `Either 'id' or 'slug' must be provided for ${technicalName}`
                )
              }

              let query = this.supabase.from(model.table_name).select("*")
              if (id) query = query.eq("id", id)
              if (slug) query = query.eq("slug", slug)

              if (model.has_draft_mode && !preview)
                query = query.eq("status", "published")

              if (model.is_singleton && !id && !slug) {
                const { data } = await query.limit(1).maybeSingle()
                if (!data) return null
                return !preview ? { ...data, _draft: null } : data
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
              const queryBuilder = this.supabase
                .from(model.table_name)
                .select("*", { count: "exact" })

              const { query: filteredQuery } = await this.applyFilters(
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

              const results = (data as Record<string, unknown>[] | null) ?? []
              return !preview
                ? results.map((item) => ({ ...item, _draft: null }))
                : results
            },
          }
        })
        return queryFields
      },
    })
  }

  private async applyFilters(
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

  private generateFinalSchema(QueryType: GraphQLObjectType): GraphQLSchema {
    const SiteSettingsType = new GraphQLObjectType({
      name: "SiteSettings",
      fields: {
        defaultPageTitle: { type: GraphQLString },
        titleSuffix: { type: GraphQLString },
        fallbackDescription: { type: GraphQLString },
        noIndex: { type: GraphQLBoolean },
        siteUrl: { type: GraphQLString },
        favicon: { type: MediaType },
      },
    })

    const SocialSettingsType = new GraphQLObjectType({
      name: "SocialSettings",
      fields: {
        socialSiteName: { type: GraphQLString },
        twitterHandle: { type: GraphQLString },
        twitterUrl: { type: GraphQLString },
        facebookUrl: { type: GraphQLString },
        instagramUrl: { type: GraphQLString },
        linkedinUrl: { type: GraphQLString },
        youtubeUrl: { type: GraphQLString },
        tiktokUrl: { type: GraphQLString },
        socialCard: { type: MediaType },
        ogType: { type: GraphQLString },
        ogLocale: { type: GraphQLString },
        twitterCardType: { type: GraphQLString },
      },
    })

    const schemaFields: GraphQLFieldConfigMap<unknown, unknown> = {
      ...QueryType.toConfig().fields,
      siteSettings: {
        type: SiteSettingsType,
        resolve: async () => {
          const { data } = await this.supabase
            .from("globals")
            .select("value")
            .eq("key", "site_settings")
            .single()

          if (!data?.value) return null
          const settings = data.value as Record<string, unknown>

          if (settings.favicon && typeof settings.favicon === "string") {
            const { data: mediaData } = await this.supabase
              .from("media_assets")
              .select("*")
              .eq("id", settings.favicon)
              .single()
            settings.favicon = mediaData
          }
          return settings
        },
      },
      socialSettings: {
        type: SocialSettingsType,
        resolve: async () => {
          const { data } = await this.supabase
            .from("globals")
            .select("value")
            .eq("key", "social_settings")
            .maybeSingle()

          if (!data?.value) return null
          const settings = data.value as Record<string, unknown>

          if (settings.socialCard && typeof settings.socialCard === "string") {
            const { data: mediaData } = await this.supabase
              .from("media_assets")
              .select("*")
              .eq("id", settings.socialCard)
              .single()
            settings.socialCard = mediaData
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

  private getGraphQLType(field: CMSField, isInput = false) {
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
        if (!isInput && this.blockUnionType) {
          return new GraphQLList(this.blockUnionType)
        }
        return GraphQLJSON
      case "structured_text":
        if (!isInput && this.structuredTextType) {
          return this.structuredTextType
        }
        return GraphQLJSON
      case "navigation":
      case "standings_table":
        return GraphQLJSON
      case "select":
        return GraphQLString
      default:
        return GraphQLString
    }
  }


  private toPascalCase(str: string) {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
      .replace(/^[0-9]/, "M_")
  }
}
