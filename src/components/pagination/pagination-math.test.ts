import { describe, it, expect } from "vitest"
import { clampPage, getPageNumbers } from "./pagination-math"

describe("clampPage", () => {
  it("returns 1 when there is only one page", () => {
    expect(clampPage(3, 1)).toBe(1)
  })

  it("clamps negative pages up to 1", () => {
    expect(clampPage(-2, 10)).toBe(1)
  })

  it("clamps pages beyond the last page", () => {
    expect(clampPage(99, 10)).toBe(10)
  })

  it("passes valid pages through unchanged", () => {
    expect(clampPage(4, 10)).toBe(4)
  })
})

describe("getPageNumbers", () => {
  it("renders a single page", () => {
    expect(getPageNumbers(1, 1)).toEqual([1])
  })

  it("shows every page when the total is small enough to fit", () => {
    expect(getPageNumbers(3, 6)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("keeps first, last and neighbours for large page counts", () => {
    expect(getPageNumbers(5, 20)).toEqual([1, "…", 4, 5, 6, "…", 20])
  })

  it("does not insert ellipsis next to the boundary pages", () => {
    expect(getPageNumbers(1, 20)).toEqual([1, 2, "…", 20])
    expect(getPageNumbers(20, 20)).toEqual([1, "…", 19, 20])
  })

  it("clamps an out-of-range current page before building the list", () => {
    expect(getPageNumbers(50, 10)).toEqual([1, "…", 9, 10])
  })
})
