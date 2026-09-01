import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePagination } from "./use-pagination"

describe("usePagination", () => {
  it("starts on page 1 with the default page size and no records", () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(25)
    expect(result.current.totalRecords).toBe(0)
  })

  it("resets to the first page", () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setPage(4))
    act(() => result.current.resetPage())
    expect(result.current.page).toBe(1)
  })

  it("resets to the first page when the page size changes", () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setPage(3))
    act(() => result.current.handlePageSizeChange(50))
    expect(result.current.pageSize).toBe(50)
    expect(result.current.page).toBe(1)
  })

  it("moves back a page when a deletion empties the last page", () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.handleTotal(51)) // 25 per page -> 3 pages
    act(() => result.current.setPage(3))
    act(() => result.current.handleRecordDeleted()) // 50 records -> 2 pages
    expect(result.current.totalRecords).toBe(50)
    expect(result.current.page).toBe(2)
  })

  it("stays on the current page when a deletion leaves records on it", () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.handleTotal(60)) // 25 per page -> 3 pages
    act(() => result.current.setPage(3))
    act(() => result.current.handleRecordDeleted()) // 59 records -> still 3 pages
    expect(result.current.totalRecords).toBe(59)
    expect(result.current.page).toBe(3)
  })

  it("clamps an out-of-range page to the last page", () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.handleTotal(10)) // 25 per page -> 1 page
    act(() => result.current.setPage(5))
    act(() => result.current.clampToLastPage(10))
    expect(result.current.page).toBe(1)
  })
})
