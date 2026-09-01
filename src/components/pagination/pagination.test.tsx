import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import Pagination from "./index"

describe("Pagination", () => {
  const baseProps = {
    page: 1,
    pageSize: 25,
    totalRecords: 127,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  }

  it("renders the record summary", () => {
    render(<Pagination {...baseProps} />)
    expect(screen.getByText("Showing 1–25 of 127")).toBeInTheDocument()
  })

  it("highlights the current page", () => {
    render(<Pagination {...baseProps} page={2} />)
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("disables prev on the first page and next on the last page", () => {
    const { rerender } = render(<Pagination {...baseProps} page={1} />)
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled()

    // 127 records at 25 per page -> 6 pages
    rerender(<Pagination {...baseProps} page={6} />)
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled()
  })

  it("calls onPageChange when navigating to the next page", () => {
    render(<Pagination {...baseProps} />)
    fireEvent.click(screen.getByRole("button", { name: "Next page" }))
    expect(baseProps.onPageChange).toHaveBeenCalledWith(2)
  })

  it("calls onPageChange when a page number is clicked", () => {
    render(<Pagination {...baseProps} />)
    fireEvent.click(screen.getByRole("button", { name: "Page 4" }))
    expect(baseProps.onPageChange).toHaveBeenCalledWith(4)
  })

  it("calls onPageSizeChange when the page size selector changes", async () => {
    render(<Pagination {...baseProps} />)
    fireEvent.click(screen.getByRole("combobox", { name: "Records per page" }))
    fireEvent.click(await screen.findByRole("option", { name: "50" }))
    expect(baseProps.onPageSizeChange).toHaveBeenCalledWith(50)
  })
})
