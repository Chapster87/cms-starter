"use client"

import { use } from "react"
import Link from "next/link"
import { useModels } from "@/hooks/use-models"
import FieldList from "./_components/field-list"
import s from "./style.module.css"

interface ModelPageProps {
  params: Promise<{
    model: string | undefined
  }>
}

/**
 * Renders the schema management page for a specific model.
 */
export default function ModelSchemaPage({ params }: ModelPageProps) {
  const { model: modelSlug } = use(params)
  const { models, loading, error } = useModels()

  const modelData = models.find(
    (m) => m.slug === modelSlug || m.table_name === modelSlug
  )

  if (loading) return <p>Loading schema...</p>
  if (error) return <p>Error: {error}</p>
  if (!modelData) return <p>Model not found: {modelSlug}</p>

  return (
    <div className={s.modelMain}>
      <div className={s.header}>
        <div className={s.titleGroup}>
          <h1>
            {modelData.emoji && (
              <span className={s.emojiPrefix}>{modelData.emoji}</span>
            )}
            {modelData.friendly_name}{" "}
          </h1>
        </div>
        <Link href={`?action=edit-model&modelSlug=${modelSlug}`}>
          <button type="button" className={s.settingsButton}>
            Model Settings
          </button>
        </Link>
      </div>

      <FieldList modelId={modelData.id} />
    </div>
  )
}
