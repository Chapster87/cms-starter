import { describe, expect, it } from "vitest"

import { CMSModel, ExtendedCMSField, ResolverFactory } from "@/server/cms/cda/ResolverFactory"

/**
 * Creates a mock Supabase client for testing resolution logic in isolation.
 */
const createMockSupabase = function() {
  return {
    from: function(table: string) {
      return {
        select: function() {
          return {
            in: async function(column: string, values: string[]) {
              if (table === "media_assets") {
                const assets = [
                  { id: "asset-1", url: "https://example.com/asset-1.png", name: "Asset 1" },
                  { id: "asset-2", url: "https://example.com/asset-2.png", name: "Asset 2" },
                ]
                const data = assets.filter(function(a) {
                  return values.includes(a.id)
                })
                return { data, error: null }
              }
              if (table === "authors") {
                const authors = [
                  { id: "author-1", name: "John Doe" },
                ]
                const data = authors.filter(function(a) {
                  return values.includes(a.id)
                })
                return { data, error: null }
              }
              if (table === "articles") {
                const articles = [
                  { id: "article-1", title: "Article 1", author: "author-1" },
                ]
                const data = articles.filter(function(a) {
                  return values.includes(a.id)
                })
                return { data, error: null }
              }
              return { data: [], error: null }
            },
            eq: function(column: string, value: string) {
              return {
                single: async function() {
                  if (table === "media_assets") {
                    if (value === "logo-asset-id") {
                      return {
                        data: { id: "logo-asset-id", url: "https://example.com/logo.png" },
                        error: null,
                      }
                    }
                  }
                  if (table === "teams") {
                    if (value === "team-1") {
                      return {
                        data: { id: "team-1", name: "FC Awesome", logo: "logo-asset-id" },
                        error: null,
                      }
                    }
                  }
                  return { data: null, error: new Error("Not found") }
                },
              }
            },
          }
        },
      }
    },
  } as any
}

describe("ResolverFactory", function() {
  const mockModels: CMSModel[] = [
    {
      id: "model_articles",
      model_id: "articles",
      model_name: "Articles",
      friendly_name: "Articles",
      table_name: "articles",
    },
    {
      id: "model_authors",
      model_id: "authors",
      model_name: "Authors",
      friendly_name: "Authors",
      table_name: "authors",
    },
  ]

  it("should resolve single media assets correctly", async function() {
    const supabase = createMockSupabase()
    const factory = new ResolverFactory(supabase, mockModels)
    const field: ExtendedCMSField = {
      id: "f1",
      slug: "featured_image",
      field_label: "Featured Image",
      field_type: "media",
      ui_order: 1,
      settings: { allow_multiple: false },
    } as any

    const resolver = factory.createMediaResolver(field)
    const result = await resolver({ featured_image: "asset-1" })

    expect(result).toEqual({
      id: "asset-1",
      url: "https://example.com/asset-1.png",
      name: "Asset 1",
    })
  })

  it("should resolve multiple media assets correctly", async function() {
    const supabase = createMockSupabase()
    const factory = new ResolverFactory(supabase, mockModels)
    const field: ExtendedCMSField = {
      id: "f2",
      slug: "gallery",
      field_label: "Gallery",
      field_type: "media",
      ui_order: 2,
      settings: { allow_multiple: true },
    } as any

    const resolver = factory.createMediaResolver(field)
    const result = await resolver({ gallery: ["asset-1", "asset-2"] })

    expect(result).toEqual([
      { id: "asset-1", url: "https://example.com/asset-1.png", name: "Asset 1" },
      { id: "asset-2", url: "https://example.com/asset-2.png", name: "Asset 2" },
    ])
  })

  it("should prioritize draft values for media fields when draft mode is active", async function() {
    const supabase = createMockSupabase()
    const factory = new ResolverFactory(supabase, mockModels)
    const field: ExtendedCMSField = {
      id: "f1",
      slug: "featured_image",
      field_label: "Featured Image",
      field_type: "media",
      ui_order: 1,
      settings: { allow_multiple: false },
    } as any

    const resolver = factory.createMediaResolver(field)
    const result = await resolver({
      featured_image: "asset-1",
      _draft: { featured_image: "asset-2" },
    })

    expect(result).toEqual({
      id: "asset-2",
      url: "https://example.com/asset-2.png",
      name: "Asset 2",
    })
  })

  it("should resolve single model references correctly", async function() {
    const supabase = createMockSupabase()
    const factory = new ResolverFactory(supabase, mockModels)
    const field: ExtendedCMSField = {
      id: "f3",
      slug: "author",
      field_label: "Author",
      field_type: "reference",
      ui_order: 3,
      settings: { allow_multiple: false, allowed_models: ["model_authors"] },
    } as any

    const resolver = factory.createReferenceResolver(field, mockModels[1])
    const result = await resolver({ author: "author-1" })

    expect(result).toEqual({
      id: "author-1",
      name: "John Doe",
    })
  })

  it("should resolve block / JSON fields recursively", async function() {
    const supabase = createMockSupabase()
    const factory = new ResolverFactory(supabase, mockModels)
    const field: ExtendedCMSField = {
      id: "f4",
      slug: "meta",
      field_label: "Meta",
      field_type: "json",
      ui_order: 4,
      settings: {},
    } as any

    const resolver = factory.createBlockResolver(field)
    const result = await resolver({
      meta: {
        team_id: "team-1",
      },
    })

    expect(result).toEqual({
      team_id: "team-1",
      id: "team-1",
      name: "FC Awesome",
      logo: "logo-asset-id",
      team_logo: { id: "logo-asset-id", url: "https://example.com/logo.png" },
    })
  })

  it("should prevent infinite recursion on circular dependencies", async function() {
    const supabase = createMockSupabase()
    const factory = new ResolverFactory(supabase, mockModels)

    const cycleNode: any = {
      id: "node-cycle",
    }
    cycleNode.ref = cycleNode

    const result: any = await factory.resolveNode(cycleNode)
    expect(result.id).toBe("node-cycle")
    expect(result.ref).toBeDefined()
    expect(result.ref.id).toBe("node-cycle")
  })
})
