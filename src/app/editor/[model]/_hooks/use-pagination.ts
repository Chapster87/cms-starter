"use client"

import { useCallback, useState } from "react"
import { clampPage } from "@/components/pagination/pagination-math"

const DEFAULT_PAGE_SIZE = 25

/**
 * Owns the pagination state for the record list: the current page, the page
 * size, and the total record count, plus the clamping rules that keep the
 * page within range when the record set shrinks.
 */
export function usePagination() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalRecords, setTotalRecords] = useState(0)

  /** Resets to the first page, e.g. when the sort or page size changes. */
  const resetPage = useCallback(() => setPage(1), [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  /** Registers the total returned by the server for the current page. */
  const handleTotal = useCallback((total: number) => {
    setTotalRecords(total)
  }, [])

  /** Moves back a page when the current page is beyond the new last page. */
  const clampToLastPage = useCallback(
    (total: number) => {
      setPage((currPage) =>
        clampPage(currPage, Math.max(1, Math.ceil(total / pageSize)))
      )
    },
    [pageSize]
  )

  /**
   * Records a deletion: keeps the total count accurate and moves back a page
   * when the deleted row was the last one on the last page.
   */
  const handleRecordDeleted = useCallback(() => {
    setTotalRecords((prev) => Math.max(0, prev - 1))
    setPage((currPage) =>
      clampPage(currPage, Math.max(1, Math.ceil((totalRecords - 1) / pageSize)))
    )
  }, [totalRecords, pageSize])

  return {
    page,
    pageSize,
    totalRecords,
    setPage,
    resetPage,
    handlePageSizeChange,
    handleTotal,
    clampToLastPage,
    handleRecordDeleted,
  }
}
