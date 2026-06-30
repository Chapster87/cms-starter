"use client"

import { useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"

/**
 * Hook for handling schema modal navigation and closing logic.
 */
export function useSchemaModalNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const parsedAction = useMemo(() => {
    const action = searchParams.get("action")
    if (!action) return null

    // Determine entity type
    let entityType:
      | "model"
      | "field"
      | "group"
      | "block"
      | "block-group"
      | null = null
    if (action.includes("block-group")) entityType = "block-group"
    else if (action.includes("block")) entityType = "block"
    else if (action.includes("group")) entityType = "group"
    else if (action.includes("field")) entityType = "field"
    else if (action.includes("model")) entityType = "model"

    // Determine mode
    let mode: "create" | "edit" | "duplicate" = "create"
    if (action.startsWith("edit-")) mode = "edit"
    else if (action.startsWith("duplicate-")) mode = "duplicate"
    else if (action.startsWith("new-")) mode = "create"

    return {
      raw: action,
      entityType,
      mode,
    }
  }, [searchParams])

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
    action: parsedAction,
  }
}
