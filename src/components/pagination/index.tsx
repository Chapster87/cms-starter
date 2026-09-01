"use client"

import { useMemo } from "react"
import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import clsx from "clsx"
import { clampPage, getPageNumbers } from "./pagination-math"
import s from "./style.module.css"

export interface PaginationProps {
  page: number
  pageSize: number
  totalRecords: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100]

/**
 * Pagination controls with a records-per-page selector, a record summary,
 * and prev/next + numbered page navigation.
 */
export default function Pagination({
  page,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const currentPage = clampPage(page, totalPages)
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  )

  const start = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalRecords)

  return (
    <div className={s.root}>
      <div className={s.pageSize}>
        <span className={s.label}>Rows per page</span>
        <Select.Root
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <Select.Trigger
            className={s.selectTrigger}
            aria-label="Records per page"
          >
            <Select.Value />
            <Select.Icon className={s.selectIcon}>
              <ChevronDown size={14} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className={s.selectContent}
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport className={s.selectViewport}>
                {pageSizeOptions.map((size) => (
                  <Select.Item
                    key={size}
                    value={String(size)}
                    className={s.selectItem}
                  >
                    <Select.ItemText>{size}</Select.ItemText>
                    <Select.ItemIndicator className={s.selectItemIndicator}>
                      <Check size={14} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      <span className={s.summary}>
        Showing {start}–{end} of {totalRecords}
      </span>

      <div className={s.nav}>
        <button
          type="button"
          className={s.navButton}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers.map((pageNum, idx) =>
          pageNum === "…" ? (
            <span key={`ellipsis-${idx}`} className={s.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={pageNum}
              type="button"
              className={clsx(s.pageButton, pageNum === currentPage && s.active)}
              onClick={() => onPageChange(pageNum)}
              aria-current={pageNum === currentPage ? "page" : undefined}
              aria-label={`Page ${pageNum}`}
            >
              {pageNum}
            </button>
          )
        )}

        <button
          type="button"
          className={s.navButton}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
