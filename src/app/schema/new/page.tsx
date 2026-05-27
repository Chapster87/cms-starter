"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import s from "./style.module.css"
import { useAuth } from "@/hooks/use-auth"

/**
 * @TODO: Add authentication and authorization checks.
 */

/**
 * Renders the page for creating a new model (Supabase table).
 */
export default function NewModelPage() {
  const router = useRouter()
  const { accessToken } = useAuth()
  const [modelName, setModelName] = useState("")
  const [friendlyName, setFriendlyName] = useState("")
  const [isSingleton, setIsSingleton] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /**
   * Handles the submission of the new model form.
   */
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setLoading(true)
      setError(null)
      setSuccess(null)

      if (!modelName.trim()) {
        setError("Table name cannot be empty.")
        setLoading(false)
        return
      }

      if (!accessToken) {
        setError("Unauthorized: No access token available.")
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/models", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: modelName,
            friendly_name: friendlyName || modelName,
            is_singleton: isSingleton,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create model.")
        }

        setSuccess(`Model '${modelName}' created successfully!`)
        router.push("/schema")
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create model."
        setError(errorMessage)
        console.error("Error creating model:", err)
      } finally {
        setLoading(false)
      }
    },
    [modelName, friendlyName, isSingleton, router, accessToken]
  )

  return (
    <div className={s.newModelContainer}>
      <h1>Create New Model</h1>
      <p>Define a new database table and its metadata.</p>

      <form onSubmit={handleSubmit} className={s.modelForm}>
        <div className={s.formGroup}>
          <label htmlFor="modelName" className={s.label}>
            Model Name:
          </label>
          <input
            type="text"
            id="modelName"
            value={modelName}
            onChange={(e) =>
              setModelName(
                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
              )
            }
            disabled={loading}
            className={s.input}
            placeholder="e.g., blog_posts (lowercase, no spaces)"
            required
          />
        </div>

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
            placeholder="e.g., Blog Posts"
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
            Is Singleton? (Only 1 instance allowed, e.g. Site Settings)
          </label>
        </div>

        {error && <p className={s.errorMessage}>{error}</p>}
        {success && <p className={s.successMessage}>{success}</p>}

        <div className={s.actions}>
          <button type="submit" disabled={loading} className={s.submitButton}>
            {loading ? "Creating..." : "Create Model"}
          </button>
          <Link href="/schema">
            <button type="button" className={s.cancelButton}>
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}
