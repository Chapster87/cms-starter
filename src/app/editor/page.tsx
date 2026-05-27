"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import s from "./style.module.css"

interface ModelRegistryEntry {
  id: string
  table_name: string
  slug: string
  friendly_name: string
  is_singleton: boolean
  display_order: number
}

/**
 * Renders the Editor landing page.
 * Displays a list of all models for the user to choose which one to edit.
 */
export default function EditorLandingPage() {
  const { accessToken, loading: authLoading } = useAuth()
  const [models, setModels] = useState<ModelRegistryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async (token: string) => {
    try {
      const response = await fetch("/api/models", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch models.")
      }
      const data: ModelRegistryEntry[] = await response.json()
      setModels(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load models.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        if (accessToken) {
          fetchModels(accessToken)
        } else {
          setLoading(false)
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [accessToken, authLoading, fetchModels])

  if (loading || authLoading) return <p>Loading editor...</p>
  if (error) return <p className={s.error}>Error: {error}</p>

  return (
    <div className={s.container}>
      <h1>Content Editor</h1>
      <p>Select a model below to manage its records.</p>

      <div className={s.modelGrid}>
        {models.map((model) => (
          <Link
            key={model.id}
            href={`/editor/${model.slug}`}
            className={s.modelCard}
          >
            <div className={s.cardHeader}>
              <svg className="feather-icon" width="24" height="24">
                <use href="/feather-sprite.svg#file-text" />
              </svg>
              <h2>{model.friendly_name}</h2>
            </div>
            <p className={s.modelMeta}>
              {model.is_singleton ? "Singleton Model" : "Collection"}
            </p>
          </Link>
        ))}
        {models.length === 0 && (
          <p>No models found. Create one in the Schema section first.</p>
        )}
      </div>
    </div>
  )
}
