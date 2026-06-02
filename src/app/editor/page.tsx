"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useModels } from "@/hooks/use-models"
import s from "./style.module.css"

/**
 * Renders the Editor landing page.
 * Redirects to the first model in the list.
 */
export default function EditorLandingPage() {
  const { models, loading } = useModels()
  const router = useRouter()

  useEffect(() => {
    if (!loading && models.length > 0) {
      router.push(`/editor/${models[0].slug}`)
    }
  }, [models, loading, router])

  if (loading) return null

  return (
    <div className={s.placeholder}>
      <h1>Content Editor</h1>
      <p>Select a model from the sidebar to manage its records.</p>
      {models.length === 0 && (
        <p>No models found. Create one in the Schema section first.</p>
      )}
    </div>
  )
}
