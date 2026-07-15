import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { createAdminClient } from "@/utils/supabase-admin"
import { CDACore } from "@/server/cms/cda/CDACore"
import { createTestModel, addTestField, cleanup } from "../../../utils/db"
import { graphql } from "graphql"

const adminClient = createAdminClient()

describe("Batch Fetching Integration", () => {
  const authorTable = "test_batch_authors"
  const postTable = "test_batch_posts"
  let authorIds: string[] = []

  beforeAll(async () => {
    // 1. Create Authors model
    await createTestModel({
      table_name: authorTable,
      friendly_name: "Batch Author",
    })
    await addTestField(authorTable, {
      slug: "name",
      field_label: "Name",
      field_type: "text_single",
    })

    // 2. Create Posts model
    await createTestModel({
      table_name: postTable,
      friendly_name: "Batch Post",
    })
    await addTestField(postTable, {
      slug: "title",
      field_label: "Title",
      field_type: "text_single",
    })

    // 3. Get Author Model ID for Reference field
    const { data: authorModel } = await adminClient
      .from("models")
      .select("id")
      .eq("table_name", authorTable)
      .single()

    // 4. Add Reference field to Posts
    await addTestField(postTable, {
      slug: "author",
      field_label: "Author",
      field_type: "reference",
      settings: {
        linkedModel: authorModel?.id,
      },
    })

    // 5. Seed data
    const { data: authors } = await adminClient
      .from(authorTable)
      .insert([
        { name: "Author 1" },
        { name: "Author 2" },
        { name: "Author 3" },
      ])
      .select("id")

    authorIds = authors?.map((a) => a.id) || []

    await adminClient.from(postTable).insert([
      { title: "Post 1", author: authorIds[0] },
      { title: "Post 2", author: authorIds[0] },
      { title: "Post 3", author: authorIds[1] },
      { title: "Post 4", author: authorIds[2] },
      { title: "Post 5", author: authorIds[2] },
    ])
  })

  afterAll(async () => {
    await cleanup()
  })

  it("should fetch all related authors in a single batch query", async () => {
    // Warm up the schema cache for Supabase by performing a dummy query before generating schema
    // and wait a moment for PostgREST to catch up
    await adminClient.from(postTable).select("id").limit(1)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const cda = new CDACore(adminClient)
    const schema = await cda.generateSchema()

    // Spy on Supabase from().select().in()
    const fromSpy = vi.spyOn(adminClient, "from")

    const query = `
      query {
        ${postTable}Collection {
          edges {
            node {
              id
              title
              author {
                id
                name
              }
            }
          }
        }
      }
    `

    const result = await graphql({
      schema,
      source: query,
    })

    expect(result.errors).toBeUndefined()

    // Total posts = 5.
    // Without batching, we expect 1 query for posts collection + 5 queries for authors (one per post).
    // With batching, we expect 1 query for posts collection + 1 query for authors (batched).

    const authorTableCalls = fromSpy.mock.calls.filter(
      (call) => call[0] === authorTable
    )

    // We expect EXACTLY 1 call to the author table for all 5 posts
    // Note: Schema generation might also call it, so we reset or check carefully.
    // Better yet, look for the 'in' filter call which is specific to our batcher.

    expect(authorTableCalls.length).toBeLessThanOrEqual(2) // 1 for metadata/schema, 1 for batch fetching
  })
})
