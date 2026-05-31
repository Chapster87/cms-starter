"use client"

import React, { Suspense } from "react"
import { useModels } from "@/hooks/use-models"
import ModelList from "./_components/model-list"
import SchemaModal from "./_components/schema-modal"
import s from "./style.module.css"

/**
 * Layout for the schema management section.
 * Provides the model list navigation and fetches data once for all sub-pages.
 */
export default function SchemaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { models, loading, error } = useModels()

  if (loading)
    return (
      <div className={s.schemaContent}>
        <p>Loading models...</p>
      </div>
    )
  if (error)
    return (
      <div className={s.schemaContent}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    )

  return (
    <div className={s.schemaContent}>
      <div className={s.sidebar}>
        <h2>Models</h2>
        <ModelList models={models} />
      </div>

      <div className={s.mainContent}>{children}</div>
      <Suspense fallback={null}>
        <SchemaModal />
      </Suspense>
    </div>
  )
}
