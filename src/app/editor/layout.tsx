"use client"

import React, { Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useModels } from "@/hooks/use-models"
import ModelSidebar from "./_components/model-sidebar"
import ModalRecord from "./[model]/_components/modal-record"
import s from "./style.module.css"

/**
 * Editor layout wrapper to handle suspense boundary for search params.
 */
function EditorLayoutContent({ children }: { children: React.ReactNode }) {
  const { models, groups, loading, error } = useModels()
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
    router.push(query || "/")
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
        <ModelSidebar models={models} groups={groups} />
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

/**
 * Layout for the editor section.
 * Provides the model list sidebar and main content area.
 * Wrapped in Suspense due to useSearchParams() usage in EditorLayoutContent.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className={s.editorContent}>
          <div className={s.placeholder}>
            <p>Loading editor...</p>
          </div>
        </div>
      }
    >
      <EditorLayoutContent>{children}</EditorLayoutContent>
    </Suspense>
  )
}
