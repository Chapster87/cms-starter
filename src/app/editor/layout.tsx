"use client"

import React from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useModels } from "@/hooks/use-models"
import ModelSidebar from "./_components/model-sidebar"
import ModalRecord from "./[model]/_components/modal-record"
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
  const { models, loading, error } = useModels()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const modelSlug = params?.model as string | undefined
  const modelData = models.find((m) => m.slug === modelSlug)
  const isNewRecordModalOpen = searchParams.get("action") === "new-record"

  const handleCloseModal = () => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete("action")
    const search = newParams.toString()
    const query = search ? `?${search}` : ""
    router.push(`${window.location.pathname}${query}`)
  }

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

      {modelSlug && (
        <ModalRecord
          model={modelSlug}
          isSingleton={modelData?.is_singleton || false}
          isOpen={isNewRecordModalOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseModal()
          }}
        />
      )}
    </div>
  )
}
