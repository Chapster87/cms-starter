"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useModels } from "@/hooks/use-models"

/**
 * Renders the models management dashboard.
 * If models exist, redirects to the first model's schema page.
 * Otherwise, displays a message and an option to create a new model.
 */
export default function ModelsDashboard() {
  const { models, loading } = useModels()
  const router = useRouter()

  useEffect(() => {
    if (!loading && models.length > 0) {
      router.push(`/schema/${models[0].slug}`)
    }
  }, [models, loading, router])

  if (loading) return null // Handled by layout loading state mostly

  return (
    <div>
      <h1>Models Management</h1>
      <p>Here you can manage your database models (tables).</p>
      {models.length === 0 && (
        <div>
          <p>No models found. Get started by creating your first one.</p>
          <Link href="/schema/new">
            <button type="button">Create New Model</button>
          </Link>
        </div>
      )}
    </div>
  )
}
