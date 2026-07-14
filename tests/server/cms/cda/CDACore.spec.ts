import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createAdminClient } from "@/utils/supabase-admin"
import { CDACore } from "@/server/cms/cda/CDACore"
import { createTestModel, addTestField, cleanup } from "../../../utils/db"
import { GraphQLObjectType, GraphQLSchema } from "graphql"

const adminClient = createAdminClient()

describe("CDACore", () => {
  const testTableName = "test_cda_model"
  let testBlockId: string

  beforeAll(async () => {
    // Create a test block
    const { data: blockData, error: blockError } = await adminClient
      .from("blocks")
      .insert({
        label: "Test Block",
        api_id: "test_block",
      })
      .select("id")
      .single()

    if (blockError) throw blockError
    testBlockId = blockData.id

    // Add a field to the block
    const { error: fieldError } = await adminClient.from("fields").insert({
      block_id: testBlockId,
      slug: "block_field",
      field_label: "Block Field",
      field_type: "text_single",
      ui_order: 0,
      settings: {},
    })
    if (fieldError) throw fieldError

    // Create a test model
    await createTestModel({
      table_name: testTableName,
      friendly_name: "Test CDA Model",
    })

    await addTestField(testTableName, {
      slug: "title",
      field_label: "Title",
      field_type: "text_single",
    })
  })

  afterAll(async () => {
    await cleanup()
    await adminClient.from("blocks").delete().eq("id", testBlockId)
  })

  it("should generate a valid schema", async () => {
    const cda = new CDACore(adminClient)
    const schema = await cda.generateSchema()

    expect(schema).toBeInstanceOf(GraphQLSchema)

    const queryType = schema.getQueryType()
    expect(queryType).toBeDefined()

    const fields = queryType?.getFields()
    expect(fields).toBeDefined()
    expect(fields?.[testTableName]).toBeDefined()
    expect(fields?.[`${testTableName}Collection`]).toBeDefined()
  })

  it("should generate block types", async () => {
    const cda = new CDACore(adminClient)
    const schema = await cda.generateSchema()

    // Internal check: access private blockTypes via any cast for testing if necessary,
    // but better to check if they are part of the schema if used in any field.
    // For now, let's just check if we can find the type in the schema's type map.

    const typeMap = schema.getTypeMap()
    expect(typeMap["TestBlockBlock"]).toBeDefined()

    const blockType = typeMap["TestBlockBlock"] as GraphQLObjectType
    expect(blockType).toBeInstanceOf(GraphQLObjectType)

    const blockFields = blockType.getFields()
    expect(blockFields["_block_type"]).toBeDefined()
    expect(blockFields["block_field"]).toBeDefined()
  })
})
