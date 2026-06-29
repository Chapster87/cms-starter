import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { CMSBlockGroup } from "@/types/fields"

interface GlobalGroupsState {
  groups: CMSBlockGroup[]
}

let globalState: GlobalGroupsState = { groups: [] }
let globalListeners: Array<(state: GlobalGroupsState) => void> = []

export function useBlockGroups() {
  const { accessToken, loading: authLoading } = useAuth()
  const [groups, setGroups] = useState<CMSBlockGroup[]>(globalState.groups)
  const [loading, setLoading] = useState(globalState.groups.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const listener = (newState: GlobalGroupsState) => {
      setGroups(newState.groups)
    }
    globalListeners.push(listener)
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener)
    }
  }, [])

  const updateGlobalState = useCallback((newState: GlobalGroupsState) => {
    globalState = newState
    globalListeners.forEach((l) => l(newState))
  }, [])

  const fetchData = useCallback(async (currentAccessToken: string) => {
    try {
      const res = await fetch("/api/blocks/groups", {
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch block groups.")
      const data = await res.json()
      return data
    } catch (err: unknown) {
      console.error("Error fetching block groups:", err)
      throw err
    }
  }, [])

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (authLoading || !accessToken) {
        if (!authLoading && !accessToken) setLoading(false)
        return
      }
      setLoading(true)
      try {
        const data = await fetchData(accessToken)
        updateGlobalState({ groups: data })
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load block groups"
        )
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [fetchData, refreshTrigger, accessToken, authLoading, updateGlobalState])

  return {
    groups,
    loading,
    error,
    refresh,
  }
}
