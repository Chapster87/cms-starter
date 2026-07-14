/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createAdminClient } from "@/utils/supabase-admin"
import { CDACore } from "@/server/cms/cda/CDACore"
import { createTestModel, addTestField, cleanup } from "../../../utils/db"
import { GraphQLUnionType, GraphQLList, GraphQLObjectType } from "graphql"

const adminClient = createAdminClient()

describe("CDACore Union Types", () => {
  const testTableName = "test_union_model_" + Date.now()
  let testBlockId: string
  let testBlockApiId: string

  beforeAll(async () => {
    testBlockApiId = "hero_block_test_" + Date.now()
    // 1. Create a test block
    const { data: blockData, error: blockError } = await adminClient
      .from("blocks")
      .insert({
        label: "Hero Block",
        api_id: testBlockApiId,
      })
      .select("id")
      .single()

    if (blockError) throw blockError
    testBlockId = blockData.id

    // 2. Add a field to the block
    await adminClient.from("fields").insert({
      block_id: testBlockId,
      slug: "heading",
      field_label: "Heading",
      field_type: "text_single",
      ui_order: 0,
      settings: {},
    })

    // 3. Create a test model with modular_content
    await createTestModel({
      table_name: testTableName,
      friendly_name: "Test Union Model",
    })

    await addTestField(testTableName, {
      slug: "content",
      field_label: "Content",
      field_type: "modular_content",
    })

    await addTestField(testTableName, {
      slug: "body",
      field_label: "Body",
      field_type: "structured_text",
    })
  })

  afterAll(async () => {
    await cleanup()
    await adminClient.from("blocks").delete().eq("id", testBlockId)
  })

  it("should return a GraphQLUnionType for modular_content fields", async () => {
    const cda = new CDACore(adminClient)
    const schema = await cda.generateSchema()

    const queryType = schema.getQueryType()
    const modelType = queryType?.getFields()[testTableName]
      .type as GraphQLObjectType
    const contentField = modelType.getFields()["content"]

    // It should be a list of Union
    expect(contentField.type).toBeInstanceOf(GraphQLList)
    const innerType = (contentField.type as GraphQLList<GraphQLUnionType>)
      .ofType

    expect(innerType).toBeInstanceOf(GraphQLUnionType)
    const unionType = innerType as GraphQLUnionType
    expect(unionType.name).toBe("BlockUnion")
    const types = unionType.getTypes()
    expect(types.map((t) => t.name)).toContain("HeroBlockBlock")
  })

  it("should return a StructuredText type for structured_text fields", async () => {
    const cda = new CDACore(adminClient)
    const schema = await cda.generateSchema()

    const queryType = schema.getQueryType()
    const modelType = queryType?.getFields()[testTableName]
      .type as GraphQLObjectType
    const bodyField = modelType.getFields()["body"]

    expect(bodyField.type).toBeInstanceOf(GraphQLObjectType)
    expect((bodyField.type as GraphQLObjectType).name).toBe("StructuredText")

    const stType = bodyField.type as GraphQLObjectType
    const stFields = stType.getFields()
    expect(stFields["value"]).toBeDefined()
    expect(stFields["blocks"]).toBeDefined()
    expect(stFields["blocks"].type).toBeInstanceOf(GraphQLList)

    const blocksInnerType = (
      stFields["blocks"].type as GraphQLList<GraphQLUnionType>
    ).ofType
    expect((blocksInnerType as GraphQLUnionType).name).toBe("BlockUnion")
  })

  it("should correctly resolve block type at runtime", async () => {
    const cda = new CDACore(adminClient)
    const schema = await cda.generateSchema()
    const blockUnion = schema.getType("BlockUnion") as GraphQLUnionType

    const resolveType = blockUnion.resolveType!

    // Check various type indicators
    const context = {} as any
    const info = {} as any
    expect(
      await resolveType(
        { _block_type: testBlockApiId },
        context,
        info,
        blockUnion
      )
    ).toBe("HeroBlockBlock")
    expect(
      await resolveType({ _type: testBlockApiId }, context, info, blockUnion)
    ).toBe("HeroBlockBlock")
    expect(
      await resolveType({ type: testBlockApiId }, context, info, blockUnion)
    ).toBe("HeroBlockBlock")
    expect(
      await resolveType({ api_id: testBlockApiId }, context, info, blockUnion)
    ).toBe("HeroBlockBlock")
    expect(
      await resolveType({ _block_id: testBlockId }, context, info, blockUnion)
    ).toBe("HeroBlockBlock")
  })
})
