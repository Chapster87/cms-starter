"use client"

import React from "react"
import { useModels } from "@/hooks/use-models"
import ModelSidebar from "./_components/model-sidebar"
import s from "./style.module.css"

/**
 * Layout for the editor section.
 * Provides the model list sidebar and main content area.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { models, loading, error, refresh } = useModels()

  if (loading)
    return (
      <div className={s.editorContent}>
        <div className={s.placeholder}>
          <p>Loading models...</p>
        </div>
      </div>
    )

  if (error)
    return (
      <div className={s.editorContent}>
        <div className={s.placeholder}>
          <p style={{ color: "var(--color-danger)" }}>Error: {error}</p>
        </div>
      </div>
    )

  return (
    <div className={s.editorContent}>
      <aside className={s.sidebar}>
        <ModelSidebar models={models} />
      </aside>

      <main className={s.mainContent}>{children}</main>
    </div>
  )
}
