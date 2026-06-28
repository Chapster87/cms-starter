"use client"

import React, { Suspense } from "react"
import {
  useParams,
  useSearchParams,
  useRouter,
  usePathname,
} from "next/navigation"
import clsx from "clsx"
import { useAtomValue } from "jotai"
import { activeRecordAtom, editorVersionAtom } from "@/client/editor-store"
import { dataService, RecordBase } from "@/client/data-service"
import { useAuth } from "@/hooks/use-auth"
import { useModels } from "@/hooks/use-models"
import ModalRecord from "./[model]/_components/modal-record"
import { RecordStatus } from "./[model]/_components/status-badge"
import ModelSidebar from "./_components/model-sidebar"
import RecordDetailsSidebar from "./[model]/[id]/_components/record-details-sidebar"
import s from "./style.module.css"

/**
 * Helper component to fetch and display record details in the layout sidebar.
 */
function RecordDetailsSidebarWrapper() {
  const params = useParams()
  const { accessToken } = useAuth()
  const { models } = useModels()
  const activeRecord = useAtomValue(activeRecordAtom)
  const _version = useAtomValue(editorVersionAtom)
  const [fetchedRecord, setFetchedRecord] = React.useState<RecordBase | null>(
    null
  )
  const [_loading, setLoading] = React.useState(false)
  const model = params?.model as string
  const id = params?.id as string

  const modelData = models.find((m) => m.slug === model)

  const record =
    activeRecord && (activeRecord.id === id || activeRecord.slug === id)
      ? activeRecord
      : fetchedRecord

  React.useEffect(() => {
    // If we have an active record from the editor page, no need to fetch
    if (activeRecord && (activeRecord.id === id || activeRecord.slug === id)) {
      return
    }

    if (accessToken && model && id && id !== "new") {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        )

      const fetchRecord = async () => {
        setLoading(true)
        let data = null
        try {
          if (isUuid) {
            data = await dataService.getRecordById(model, id)
            if (!data) data = await dataService.getRecordBySlug(model, id)
          } else {
            data = await dataService.getRecordBySlug(model, id)
            if (!data) data = await dataService.getRecordById(model, id)
          }
          if (data) setFetchedRecord(data)
        } finally {
          setLoading(false)
        }
      }

      fetchRecord()
    }
  }, [accessToken, model, id, activeRecord])

  if (!record) return null

  const currentStatus: RecordStatus = !modelData?.has_draft_mode
    ? "published"
    : record.status === "published"
      ? record._draft
        ? "changed"
        : "published"
      : "draft"

  return (
    <RecordDetailsSidebar
      record={record}
      status={currentStatus}
      hasDraftMode={modelData?.has_draft_mode}
    />
  )
}

/**
 * Editor layout wrapper to handle suspense boundary for search params.
 */
function EditorLayoutContent({ children }: { children: React.ReactNode }) {
  const { models, groups, loading, error } = useModels()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const modelSlug = params?.model as string | undefined
  const modelData = models.find((m) => m.slug === modelSlug)
  const isNewRecordModalOpen = searchParams.get("action") === "new-record"

  // Check if we are on a specific record edit page (has ID in path)
  // Check both params.id and ensure it's not a 'new' record
  const isRecordEditPage =
    !!params?.id && params.id !== "new" && pathname.includes(`/${params.id}`)

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
    <div
      className={clsx(s.editorContent, {
        [s.withRightSidebar]: isRecordEditPage,
      })}
    >
      <aside className={s.sidebar}>
        <ModelSidebar models={models} groups={groups} />
      </aside>

      <main className={s.mainContent}>{children}</main>

      {isRecordEditPage && (
        <Suspense fallback={null}>
          <RecordDetailsSidebarWrapper />
        </Suspense>
      )}

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
