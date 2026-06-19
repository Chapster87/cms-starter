import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"

export interface ModelGroup {
  id: string
  name: string
  emoji?: string | null
  display_order: number
  type: "schema" | "editor"
  created_at?: string
  updated_at?: string
}

export interface ModelRegistryEntry {
  id: string
  table_name: string
  slug: string
  friendly_name: string
  group_id?: string | null
  emoji?: string | null
  is_singleton: boolean
  has_draft_mode: boolean
  display_order: number
  list_columns?: string[] | null
}

interface GlobalModelState {
  models: ModelRegistryEntry[]
  groups: ModelGroup[]
}

// Global state to sync multiple instances of useModels
let globalState: GlobalModelState = { models: [], groups: [] }
let globalListeners: Array<(state: GlobalModelState) => void> = []

/**
 * Custom hook to fetch and manage models and groups from the registry.
 * Uses a global singleton pattern to ensure all instances of the hook stay in sync.
 */
export function useModels() {
  const { accessToken, loading: authLoading } = useAuth()
  const [state, setState] = useState<GlobalModelState>(globalState)
  const [loading, setLoading] = useState(globalState.models.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Subscribe to global updates
  useEffect(() => {
    const listener = (newState: GlobalModelState) => {
      setState(newState)
    }
    globalListeners.push(listener)
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener)
    }
  }, [])

  const updateGlobalState = useCallback((newState: GlobalModelState) => {
    globalState = newState
    globalListeners.forEach((l) => l(newState))
  }, [])

  const fetchData = useCallback(async (currentAccessToken: string) => {
    try {
      // Fetch Models
      const modelsRes = await fetch("/api/models", {
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      })

      // Fetch Groups
      const groupsRes = await fetch("/api/models/groups", {
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      })

      if (!modelsRes.ok || !groupsRes.ok) {
        throw new Error("Failed to fetch models or groups.")
      }

      const models: ModelRegistryEntry[] = await modelsRes.json()
      const groups: ModelGroup[] = await groupsRes.json()

      return { models, groups }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch models."
      console.error("Error fetching models:", err)
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
        updateGlobalState(data)
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load models."
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [fetchData, refreshTrigger, accessToken, authLoading, updateGlobalState])

  const deleteModel = useCallback(
    async (modelName: string) => {
      if (!accessToken) {
        throw new Error("Unauthorized: No access token available.")
      }

      const response = await fetch(`/api/models?name=${modelName}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete model.")
      }

      refresh()
    },
    [accessToken, refresh]
  )

  return {
    models: state.models,
    groups: state.groups,
    loading: loading || authLoading,
    error,
    refresh,
    deleteModel,
  }
}
