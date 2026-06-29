"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

/**
 * Hook for handling schema modal navigation and closing logic.
 */
export function useSchemaModalNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleClose = useCallback(
    (shouldRefresh = false) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.delete("action")
      nextParams.delete("modelSlug")
      nextParams.delete("groupId")
      nextParams.delete("blockId")
      nextParams.delete("fieldId")
      nextParams.delete("fieldType")

      const queryString = nextParams.toString()
      const url = queryString ? `?${queryString}` : window.location.pathname
      router.push(url)

      if (shouldRefresh) {
        // Trigger a refresh event that components can listen for
        window.dispatchEvent(new CustomEvent("schema-update"))
      }
    },
    [router, searchParams]
  )

  return {
    handleClose,
    searchParams,
    router,
  }
}
