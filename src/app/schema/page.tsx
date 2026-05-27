"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import ModelList from "./_components/model-list"
import { useAuth } from "@/hooks/use-auth"

interface ModelRegistryEntry {
  id: string
  table_name: string
  slug: string
  friendly_name: string
  group_name?: string
  is_singleton: boolean
  display_order: number
}

/**
 * Renders the models management dashboard.
 * This page will display a list of all models (Supabase tables) and provide options to create/delete them.
 */
export default function ModelsDashboard() {
  const { accessToken, loading: authLoading } = useAuth()
  const [models, setModels] = useState<ModelRegistryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchModels = useCallback(
    async (currentAccessToken: string): Promise<ModelRegistryEntry[]> => {
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
    },
    []
  )

  useEffect(() => {
    const loadModels = async () => {
      if (authLoading || !accessToken) {
        setLoading(authLoading)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const fetchedModels = await fetchModels(accessToken)
        setModels(fetchedModels)
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load models."
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    loadModels()
  }, [fetchModels, refreshTrigger, accessToken, authLoading])

  const handleDeleteModel = useCallback(
    async (modelName: string) => {
      if (!accessToken) {
        setError("Unauthorized: No access token available.")
        return
      }

      if (
        !window.confirm(
          `Are you sure you want to delete the model '${modelName}' and all its records?`
        )
      ) {
        return
      }
      setLoading(true)
      setError(null)
      try {
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

        // Force a state refresh by incrementing the trigger
        setRefreshTrigger((prev) => prev + 1)
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete model."
        setError(errorMessage)
        console.error("Error deleting model:", err)
      } finally {
        setLoading(false)
      }
    },
    [accessToken]
  )

  if (loading || authLoading) return <p>Loading models...</p>
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>

  return (
    <div>
      <h1>Models Management</h1>
      <p>Here you can manage your database models (tables).</p>
      <Link href="/schema/new">
        <button>Create New Model</button>
      </Link>
      <ModelList models={models} onDelete={handleDeleteModel} />
    </div>
  )
}
