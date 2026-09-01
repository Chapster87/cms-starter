import { describe, it, expect, vi, beforeEach } from "vitest"
import { dataService } from "./data-service"

vi.mock("@/utils/supabase", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/utils/supabase"

describe("dataService.getRecordsPage", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockClient: any

  beforeEach(() => {
    mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [{ id: "1" }, { id: "2" }],
        count: 127,
        error: null,
      }),
    }
    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient)
    vi.clearAllMocks()
  })

  it("fetches a page of records with an exact count", async () => {
    const result = await dataService.getRecordsPage("matches")

    expect(mockClient.from).toHaveBeenCalledWith("matches")
    expect(mockClient.select).toHaveBeenCalledWith("*", { count: "exact" })
    expect(mockClient.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    })
    // Page 1 with the default page size of 25 -> rows 0..24
    expect(mockClient.range).toHaveBeenCalledWith(0, 24)
    expect(result).toEqual({
      records: [{ id: "1" }, { id: "2" }],
      total: 127,
    })
  })

  it("computes the range for the requested page and page size", async () => {
    await dataService.getRecordsPage("matches", {
      page: 3,
      pageSize: 50,
      orderBy: "name",
      orderDir: "asc",
    })

    // Page 3 with a page size of 50 -> rows 100..149
    expect(mockClient.range).toHaveBeenCalledWith(100, 149)
    expect(mockClient.order).toHaveBeenCalledWith("name", { ascending: true })
  })

  it("throws when the fetch fails", async () => {
    mockClient.range.mockResolvedValue({
      data: null,
      count: null,
      error: { message: "DB Error" },
    })

    await expect(dataService.getRecordsPage("matches")).rejects.toThrow(
      "DB Error"
    )
  })
})
