import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"

export interface ModelRegistryEntry {
  id: string
  table_name: string
  slug: string
  friendly_name: string
  group_name?: string
  emoji?: string | null
  is_singleton: boolean
  display_order: number
}

// Global state to sync multiple instances of useModels
let globalModels: ModelRegistryEntry[] = []
let globalListeners: Array<(models: ModelRegistryEntry[]) => void> = []

/**
 * Custom hook to fetch and manage models from the registry.
 * Uses a global singleton pattern to ensure all instances of the hook stay in sync.
 */
export function useModels() {
  const { accessToken, loading: authLoading } = useAuth()
  const [models, setModels] = useState<ModelRegistryEntry[]>(globalModels)
  const [loading, setLoading] = useState(globalModels.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Subscribe to global updates
  useEffect(() => {
    const listener = (newModels: ModelRegistryEntry[]) => {
      setModels(newModels)
    }
    globalListeners.push(listener)
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener)
    }
  }, [])

  const updateGlobalModels = useCallback((newModels: ModelRegistryEntry[]) => {
    globalModels = newModels
    globalListeners.forEach((l) => l(newModels))
  }, [])

  const fetchModels = useCallback(async (currentAccessToken: string) => {
    try {
      const response = await fetch("/api/models", {
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch models.")
      }
      const data: ModelRegistryEntry[] = await response.json()
      return data
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
    const loadModels = async () => {
      if (authLoading) return

      if (!accessToken) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const fetchedModels = await fetchModels(accessToken)
        updateGlobalModels(fetchedModels)
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load models."
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    loadModels()
  }, [
    fetchModels,
    refreshTrigger,
    accessToken,
    authLoading,
    updateGlobalModels,
  ])

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
    models,
    loading: loading || authLoading,
    error,
    refresh,
    deleteModel,
  }
}
