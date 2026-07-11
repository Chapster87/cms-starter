import { describe, it, expect, vi, beforeEach } from "vitest"
import { SupabaseClient } from "@supabase/supabase-js"
import { CMSModelName } from "../../../types/cms-generated"
import { SupabaseRecordManager } from "./supabase-record-manager"

describe("SupabaseRecordManager", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockClient: any
  let manager: SupabaseRecordManager

  beforeEach(() => {
    // Create a fluent mock for Supabase client
    mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    manager = new SupabaseRecordManager(mockClient as unknown as SupabaseClient)
  })

  describe("getRecords", () => {
    it("should fetch all records for a model", async () => {
      const mockData = [{ id: "1", name: "Author 1" }]
      mockClient.select.mockResolvedValue({ data: mockData, error: null })

      const result = await manager.getRecords("authors" as CMSModelName)

      expect(mockClient.from).toHaveBeenCalledWith("authors")
      expect(mockClient.select).toHaveBeenCalledWith("*")
      expect(result).toEqual(mockData)
    })

    it("should throw an error if fetching fails", async () => {
      mockClient.select.mockResolvedValue({
        data: null,
        error: { message: "DB Error" },
      })

      await expect(
        manager.getRecords("authors" as CMSModelName)
      ).rejects.toThrow("Failed to fetch records for model authors: DB Error")
    })
  })

  describe("getRecordById", () => {
    it("should fetch a single record by id", async () => {
      const mockData = { id: "1", name: "Author 1" }
      mockClient.single.mockResolvedValue({ data: mockData, error: null })

      const result = await manager.getRecordById("authors" as CMSModelName, "1")

      expect(mockClient.from).toHaveBeenCalledWith("authors")
      expect(mockClient.eq).toHaveBeenCalledWith("id", "1")
      expect(result).toEqual(mockData)
    })

    it("should return null if record is not found (PGRST116)", async () => {
      mockClient.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      })

      const result = await manager.getRecordById("authors" as CMSModelName, "1")

      expect(result).toBeNull()
    })
  })

  describe("createRecord", () => {
    it("should insert a new record and return it", async () => {
      const inputData = { name: "New Author" }
      const mockData = { id: "2", ...inputData }
      mockClient.single.mockResolvedValue({ data: mockData, error: null })

      const result = await manager.createRecord(
        "authors" as CMSModelName,
        inputData as never
      )

      expect(mockClient.from).toHaveBeenCalledWith("authors")
      expect(mockClient.insert).toHaveBeenCalledWith(inputData)
      expect(result).toEqual(mockData)
    })
  })

  describe("updateRecord", () => {
    it("should update an existing record and return it", async () => {
      const updateData = { name: "Updated Name" }
      const mockData = { id: "1", ...updateData }
      mockClient.single.mockResolvedValue({ data: mockData, error: null })

      const result = await manager.updateRecord(
        "authors" as CMSModelName,
        "1",
        updateData as never
      )

      expect(mockClient.from).toHaveBeenCalledWith("authors")
      expect(mockClient.update).toHaveBeenCalledWith(updateData)
      expect(mockClient.eq).toHaveBeenCalledWith("id", "1")
      expect(result).toEqual(mockData)
    })
  })

  describe("deleteRecord", () => {
    it("should delete a record", async () => {
      mockClient.delete.mockReturnThis()
      // Note: delete().eq() doesn't usually use .single(), it returns { error }
      // Our implementation uses await this.client.from(model).delete().eq("id", id)
      // So we need to mock eq to return the final promise
      mockClient.eq.mockResolvedValue({ error: null })

      await manager.deleteRecord("authors" as CMSModelName, "1")

      expect(mockClient.from).toHaveBeenCalledWith("authors")
      expect(mockClient.delete).toHaveBeenCalled()
      expect(mockClient.eq).toHaveBeenCalledWith("id", "1")
    })
  })
})
