/**
 * Pure helpers for pagination math shared by the record list UI.
 */

/**
 * Clamps a 1-based page number into the valid range [1, totalPages].
 */
export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 1) return 1
  return Math.min(Math.max(page, 1), totalPages)
}

/**
 * Builds the list of page numbers to render, collapsing long runs with an
 * ellipsis marker. Always keeps the first and last page plus `siblingCount`
 * neighbours of the current page.
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): Array<number | "…"> {
  const total = Math.max(1, totalPages)
  const current = clampPage(currentPage, total)

  // Small page counts fit without ellipsis.
  if (total <= siblingCount * 2 + 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const start = Math.max(2, current - siblingCount)
  const end = Math.min(total - 1, current + siblingCount)

  const pages: Array<number | "…"> = [1]

  if (start > 2) pages.push("…")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push("…")

  pages.push(total)

  return pages
}
