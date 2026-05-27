"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import s from "./style.module.css"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/utils/supabaseClient"
import FieldList from "../_components/field-list"

interface EditModelPageProps {
  params: Promise<{
    model: string | undefined
  }>
}

/**
 * Renders the page for editing model metadata (Friendly Name, Singleton status, etc.)
 */
export default function EditModelPage({ params }: EditModelPageProps) {
  const router = useRouter()
  const { model } = use(params)
  const { accessToken, loading: authLoading } = useAuth()

  const [modelId, setModelId] = useState<string | null>(null)
  const [friendlyName, setFriendlyName] = useState("")
  const [slug, setSlug] = useState("")
  const [isSingleton, setIsSingleton] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadModelMetadata = async () => {
      if (authLoading || !model) {
        console.log(
          "EditModelPage: Skipping load, authLoading or no model name."
        )
        return
      }

      console.log(`EditModelPage: Loading metadata for model: ${model}`)
      setLoading(true)
      try {
        const headers: Record<string, string> = {}
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        // Fetch model metadata via the API instead of direct client call
        const response = await fetch(`/api/models`, { headers })
        if (!response.ok) throw new Error("Failed to fetch models list")
        const allModels = await response.json()

        const data = allModels.find(
          (m: { slug: string; table_name: string }) =>
            m.slug === model || m.table_name === model
        )

        if (!data) {
          throw new Error(`Model '${model}' not found in registry.`)
        }

        console.log("EditModelPage: Loaded model data:", data)
        setModelId(data.id)
        setFriendlyName(data.friendly_name)
        setSlug(data.slug)
        setIsSingleton(data.is_singleton)
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error loading metadata"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    loadModelMetadata()
  }, [model, authLoading])

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!model || !accessToken) return

      setLoading(true)
      setError(null)
      setSuccess(null)

      try {
        // Use upsert by ID for more reliable updates
        const { error: updateError } = await supabase
          .from("models")
          .upsert({
            id: modelId,
            friendly_name: friendlyName,
            slug: slug,
            is_singleton: isSingleton,
          })
          .select()

        if (updateError) throw updateError

        setSuccess("Model settings updated successfully!")
        setTimeout(() => router.push("/schema"), 1500)
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to update settings"
        setError(msg)
      } finally {
        setLoading(false)
      }
    },
    [modelId, friendlyName, slug, isSingleton, accessToken, router]
  )

  if (loading || authLoading) return <p>Loading settings...</p>

  return (
    <div className={s.editModelContainer}>
      <h1>{`Settings for '${model}'`}</h1>
      <p>Update the metadata for this content model.</p>

      {error && <p className={s.errorMessage}>{error}</p>}
      {success && <p className={s.successMessage}>{success}</p>}

      <form onSubmit={handleSubmit} className={s.modelForm}>
        <div className={s.formGroup}>
          <label htmlFor="friendlyName" className={s.label}>
            Display Name (UI Label):
          </label>
          <input
            type="text"
            id="friendlyName"
            value={friendlyName}
            onChange={(e) => setFriendlyName(e.target.value)}
            disabled={loading}
            className={s.input}
            required
          />
        </div>

        <div className={s.formGroup}>
          <label htmlFor="slug" className={s.label}>
            URL Slug:
          </label>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
            }
            disabled={loading}
            className={s.input}
            required
          />
        </div>

        <div
          className={s.formGroup}
          style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}
        >
          <input
            type="checkbox"
            id="isSingleton"
            checked={isSingleton}
            onChange={(e) => setIsSingleton(e.target.checked)}
            disabled={loading}
          />
          <label
            htmlFor="isSingleton"
            className={s.label}
            style={{ marginBottom: 0 }}
          >
            Is Singleton? (Only 1 instance allowed)
          </label>
        </div>

        <div className={s.actions}>
          <button type="submit" disabled={loading} className={s.submitButton}>
            {loading ? "Saving..." : "Save Settings"}
          </button>
          <Link href={`/schema/${model}`}>
            <button type="button" className={s.cancelButton}>
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}
