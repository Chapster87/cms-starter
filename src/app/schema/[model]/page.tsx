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
            <span className={s.emojiPrefix}>
              {modelData.emoji || (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
            </span>
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
