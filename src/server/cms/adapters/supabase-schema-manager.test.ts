import { describe, it, expect, vi, beforeEach } from "vitest"
import { SupabaseClient } from "@supabase/supabase-js"
import { CMSModelName } from "../../../types/cms-generated"
import { SupabaseSchemaManager } from "./supabase-schema-manager"

describe("SupabaseSchemaManager", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockClient: any
  let manager: SupabaseSchemaManager

  beforeEach(() => {
    mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    manager = new SupabaseSchemaManager(mockClient as unknown as SupabaseClient)
  })

  describe("getField", () => {
    it("should fetch a field configuration", async () => {
      const mockField = { id: "f1", slug: "title", model_id: "pages" }
      mockClient.single.mockResolvedValue({ data: mockField, error: null })

      const result = await manager.getField("pages" as CMSModelName, "title")

      expect(mockClient.from).toHaveBeenCalledWith("cms_fields")
      expect(mockClient.eq).toHaveBeenCalledWith("model_id", "pages")
      expect(mockClient.eq).toHaveBeenCalledWith("slug", "title")
      expect(result).toEqual(mockField)
    })

    it("should return null if field is not found", async () => {
      mockClient.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      })

      const result = await manager.getField("pages" as CMSModelName, "none")

      expect(result).toBeNull()
    })
  })

  describe("getFieldsForModel", () => {
    it("should fetch all fields for a model ordered by ui_order", async () => {
      const mockFields = [
        { id: "f1", ui_order: 1 },
        { id: "f2", ui_order: 2 },
      ]
      mockClient.order.mockResolvedValue({ data: mockFields, error: null })

      const result = await manager.getFieldsForModel("pages" as CMSModelName)

      expect(mockClient.from).toHaveBeenCalledWith("cms_fields")
      expect(mockClient.eq).toHaveBeenCalledWith("model_id", "pages")
      expect(mockClient.order).toHaveBeenCalledWith("ui_order", {
        ascending: true,
      })
      expect(result).toEqual(mockFields)
    })
  })

  describe("getBlock", () => {
    it("should fetch a block by id or api_id", async () => {
      const mockBlock = { id: "b1", api_id: "test_block", fields: [] }
      mockClient.single.mockResolvedValue({ data: mockBlock, error: null })

      const result = await manager.getBlock("test_block")

      expect(mockClient.from).toHaveBeenCalledWith("cms_blocks")
      expect(mockClient.select).toHaveBeenCalledWith("*, fields:cms_fields(*)")
      expect(mockClient.or).toHaveBeenCalledWith(
        "id.eq.test_block,api_id.eq.test_block"
      )
      expect(result).toEqual(mockBlock)
    })
  })

  describe("getAllBlocks", () => {
    it("should fetch all blocks ordered by display_order", async () => {
      const mockBlocks = [{ id: "b1", display_order: 1 }]
      mockClient.order.mockResolvedValue({ data: mockBlocks, error: null })

      const result = await manager.getAllBlocks()

      expect(mockClient.from).toHaveBeenCalledWith("cms_blocks")
      expect(mockClient.order).toHaveBeenCalledWith("display_order", {
        ascending: true,
      })
      expect(result).toEqual(mockBlocks)
    })
  })
})
