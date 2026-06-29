import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { CMSBlock } from "@/types/fields"
import { useBlockGroups } from "./use-block-groups"

interface GlobalBlocksState {
  blocks: CMSBlock[]
}

// Global state to sync multiple instances of useBlocks
let globalState: GlobalBlocksState = { blocks: [] }
let globalListeners: Array<(state: GlobalBlocksState) => void> = []

/**
 * Custom hook to fetch and manage reusable blocks from the registry.
 */
export function useBlocks() {
  const { accessToken, loading: authLoading } = useAuth()
  const [blocks, setBlocks] = useState<CMSBlock[]>(globalState.blocks)
  const [loading, setLoading] = useState(globalState.blocks.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Subscribe to global updates
  useEffect(() => {
    const listener = (newState: GlobalBlocksState) => {
      setBlocks(newState.blocks)
    }
    globalListeners.push(listener)
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener)
    }
  }, [])

  const updateGlobalState = useCallback((newState: GlobalBlocksState) => {
    globalState = newState
    globalListeners.forEach((l) => l(newState))
  }, [])

  const fetchData = useCallback(async (currentAccessToken: string) => {
    try {
      const res = await fetch("/api/blocks", {
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error("Failed to fetch blocks.")
      }

      const data: CMSBlock[] = await res.json()
      return (data || []).sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      )
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch blocks."
      console.error("Error fetching blocks:", err)
      throw new Error(errorMessage)
    }
  }, [])

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return

      if (!accessToken) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await fetchData(accessToken)
        updateGlobalState({ blocks: data })
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load blocks."
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [fetchData, refreshTrigger, accessToken, authLoading, updateGlobalState])

  const deleteBlock = useCallback(
    async (id: string) => {
      if (!accessToken) {
        throw new Error("Unauthorized: No access token available.")
      }

      const response = await fetch(`/api/blocks?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete block.")
      }

      refresh()
    },
    [accessToken, refresh]
  )

  const {
    groups,
    refresh: refreshGroups,
    loading: groupsLoading,
  } = useBlockGroups()

  const refreshAll = useCallback(() => {
    refresh()
    refreshGroups()
  }, [refresh, refreshGroups])

  return {
    blocks,
    groups,
    loading: loading || authLoading || groupsLoading,
    error,
    refresh: refreshAll,
    deleteBlock,
  }
}
