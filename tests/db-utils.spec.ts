import { describe, it, expect, afterAll } from "vitest"
import { createAdminClient } from "@/utils/supabase-admin"
import {
  createTestModel,
  updateTestModel,
  addTestField,
  updateTestField,
  removeTestField,
  deleteTestModel,
  cleanup,
} from "./utils/db"

const adminClient = createAdminClient()

describe("Database Test Utilities", () => {
  const testTableName = "test_utils_model"

  afterAll(async () => {
    await cleanup()
  })

  it("should create a test model and register it", async () => {
    await createTestModel({
      table_name: testTableName,
      friendly_name: "Test Utils Model",
    })

    // Verify in registry
    const { data: model, error } = await adminClient
      .from("models")
      .select("*")
      .eq("table_name", testTableName)
      .single()

    expect(error).toBeNull()
    expect(model).toBeDefined()
    expect(model.table_name).toBe(testTableName)

    // Update model metadata
    await updateTestModel(testTableName, {
      friendly_name: "Thoroughly Tested Model",
      list_columns: ["test_field"],
    })

    const { data: updatedModel } = await adminClient
      .from("models")
      .select("*")
      .eq("table_name", testTableName)
      .single()

    expect(updatedModel.friendly_name).toBe("Thoroughly Tested Model")
    expect(updatedModel.list_columns).toContain("test_field")

    // Verify physical table exists
    const { error: tableCheckError } = await adminClient.rpc("exec_sql", {
      sql: `SELECT 1 FROM public."${testTableName}" LIMIT 1`,
    })
    expect(tableCheckError).toBeNull()
  })

  it("should add a test field to the model", async () => {
    await addTestField(testTableName, {
      slug: "test_field",
      field_label: "Test Field",
      field_type: "text_single",
      is_required: true,
    })

    // Verify in registry
    const { data: model } = await adminClient
      .from("models")
      .select("id")
      .eq("table_name", testTableName)
      .single()

    expect(model).toBeDefined()

    const { data: field, error } = await adminClient
      .from("fields")
      .select("*")
      .eq("model_id", model!.id)
      .eq("slug", "test_field")
      .single()

    expect(error).toBeNull()
    expect(field).toBeDefined()
    expect(field.field_type).toBe("text_single")
    expect(field.is_required).toBe(true)

    // Verify physical column exists
    const { error: columnCheckError } = await adminClient.rpc("exec_sql", {
      sql: `SELECT "test_field" FROM public."${testTableName}" LIMIT 1`,
    })
    expect(columnCheckError).toBeNull()
  })

  it("should update a test field", async () => {
    await updateTestField(testTableName, "test_field", {
      field_label: "Updated Test Field",
    })

    const { data: model } = await adminClient
      .from("models")
      .select("id")
      .eq("table_name", testTableName)
      .single()

    const { data: field } = await adminClient
      .from("fields")
      .select("*")
      .eq("model_id", model!.id)
      .eq("slug", "test_field")
      .single()

    expect(field!.field_label).toBe("Updated Test Field")
  })

  it("should remove a test field", async () => {
    await removeTestField(testTableName, "test_field")

    const { data: model } = await adminClient
      .from("models")
      .select("id")
      .eq("table_name", testTableName)
      .single()

    const { data: field } = await adminClient
      .from("fields")
      .select("*")
      .eq("model_id", model!.id)
      .eq("slug", "test_field")
      .single()

    expect(field).toBeNull()

    // Verify physical column is gone
    const { error: columnCheckError } = await adminClient.rpc("exec_sql", {
      sql: `SELECT "test_field" FROM public."${testTableName}" LIMIT 1`,
    })
    expect(columnCheckError).toBeDefined()
  })

  it("should cleanup test models", async () => {
    const anotherTable = "test_cleanup_model"
    await createTestModel({
      table_name: anotherTable,
      friendly_name: "Cleanup Model",
    })

    await deleteTestModel(anotherTable)

    // Verify registry is empty
    const { data: model } = await adminClient
      .from("models")
      .select("*")
      .eq("table_name", anotherTable)
      .single()
    expect(model).toBeNull()

    // Verify table is dropped
    const { error: tableCheckError } = await adminClient.rpc("exec_sql", {
      sql: `SELECT 1 FROM public."${anotherTable}" LIMIT 1`,
    })
    expect(tableCheckError).toBeDefined()
  })
})
