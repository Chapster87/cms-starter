"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAtom } from "jotai"
import { activeRecordAtom, editorStore } from "@/client/editor-store"
import { toast } from "@/client/toast-store"
import { dataService, RecordBase } from "@/client/data-service"
import Button from "@/components/button"
import ContextMenu from "@/components/context-menu"
import SvgIcon from "@/components/svg-icon"
import { ModelRegistryEntry } from "@/hooks/use-models"
import { CMSModelName } from "@/types/cms-generated"
import RecordForm from "@/app/editor/[model]/_components/record-form"
import StatusBadge, {
  RecordStatus,
} from "@/app/editor/[model]/_components/status-badge"
import s from "../style.module.css"

interface EditRecordClientProps {
  modelSlug: string
  id: string
  initialRecord: RecordBase
  modelData?: ModelRegistryEntry
  displayName: string
}

export default function EditRecordClient({
  modelSlug,
  id,
  initialRecord,
  modelData,
  displayName,
}: EditRecordClientProps) {
  const router = useRouter()
  const model = modelSlug as CMSModelName

  const [record] = useAtom(activeRecordAtom)
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const targetTable = modelData?.table_name || modelSlug || ""

  // Hydrate the store with server-provided record
  // We use useEffect to avoid "update during render" errors in React 18+
  useEffect(() => {
    if (initialRecord) {
      editorStore.setRecord(initialRecord)
    }
  }, [initialRecord])

  useEffect(() => {
    return () => {
      editorStore.setRecord(null)
    }
  }, [])

  const loadRecord = useCallback(async () => {
    if (!targetTable || !id) return

    const executeLoad = async (isRetry = false) => {
      setLoading(true)
      if (!isRetry) setError(null)

      try {
        const data = await dataService.getRecordById(targetTable, id, {
          resolve: true,
        })
        if (!data) {
          // If this is a reload after save, maybe give it a moment
          if (!isRetry) {
            console.log(
              "[EditRecordClient] Record not found on first attempt, retrying..."
            )
            setTimeout(() => executeLoad(true), 1000)
            return
          }
          console.error("[EditRecordClient] Record not found after retry.")
          setError("Record not found.")
        } else {
          editorStore.setRecord(data)
          setError(null)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading record")
      } finally {
        setLoading(false)
      }
    }

    await executeLoad()
  }, [targetTable, id])

  const handleAutoSave = useCallback(
    (formData: Record<string, unknown>) => {
      if (!targetTable || !record?.id || !modelData?.has_draft_mode) return

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(async () => {
        setIsSaving(true)
        try {
          const isFirstDraft = !record?._draft
          const modelId = modelData?.id
          await dataService.autoSaveRecord(
            targetTable,
            record.id,
            formData,
            modelId
          )
          editorStore.setRecord(
            record ? { ...record, _draft: formData } : record
          )

          if (isFirstDraft) {
            toast.info(
              "Page updated.",
              "Unsaved changes have been saved as a draft."
            )
          }
        } catch (err) {
          console.error("Auto-save failed:", err)
        } finally {
          setIsSaving(false)
        }
      }, 2000)
    },
    [targetTable, record, modelData]
  )

  const handlePublish = async (formData: Record<string, unknown>) => {
    if (!targetTable || !record?.id) return

    setLoading(true)
    setError(null)
    try {
      const modelId = modelData?.id
      if (modelData?.has_draft_mode) {
        await dataService.publishRecord(
          targetTable,
          record.id,
          formData,
          modelId
        )
      } else {
        await dataService.updateRecord(
          targetTable,
          record.id,
          formData,
          modelId
        )
      }
      toast.success("Record published", "Your changes are now live.")
      await loadRecord()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to publish record"
      setError(msg)
      toast.error("Publish failed", msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDiscard = async () => {
    if (!targetTable || !record?.id) return
    if (!confirm("Are you sure you want to discard all unpublished changes?"))
      return

    setLoading(true)
    try {
      await dataService.discardChanges(targetTable, record.id)
      await loadRecord()
      toast.success("Changes discarded", "Draft has been reset.")
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to discard changes"
      setError(msg)
      toast.error("Discard failed", msg)
    } finally {
      setLoading(false)
    }
  }

  const handleUnpublish = async () => {
    if (!targetTable || !record?.id) return
    if (
      !confirm(
        "Are you sure you want to unpublish this record? It will no longer be visible on the live site."
      )
    )
      return

    setLoading(true)
    try {
      const modelId = modelData?.id
      await dataService.unpublishRecord(targetTable, record.id, modelId)
      await loadRecord()
      toast.success(
        "Record unpublished",
        "The record has been set back to draft."
      )
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to unpublish record"
      setError(msg)
      toast.error("Unpublish failed", msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!targetTable || !record?.id) return
    if (
      !confirm(
        "Are you sure you want to delete this record? This action cannot be undone."
      )
    )
      return

    setLoading(true)
    try {
      await dataService.deleteRecord(targetTable, record.id)
      toast.success("Record deleted", "The record has been removed.")
      router.push(`/editor/${model}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete record"
      setError(msg)
      toast.error("Delete failed", msg)
    } finally {
      setLoading(false)
    }
  }

  const currentStatus: RecordStatus = useMemo(() => {
    if (!modelData?.has_draft_mode) return "published"
    const recordToEvaluate = record || initialRecord
    if (recordToEvaluate.status === "published") {
      return recordToEvaluate._draft ? "changed" : "published"
    }
    return "draft"
  }, [modelData?.has_draft_mode, record, initialRecord])

  const workingData =
    modelData?.has_draft_mode && record?._draft
      ? { ...record, ...(record._draft as object) }
      : record || initialRecord

  return (
    <div className={s.container}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <Link href={`/editor/${model}`} className={s.backLink}>
            <Button unstyled className={s.backButton}>
              <SvgIcon icon="arrow-left" size={20} />
            </Button>
          </Link>
          <div className={s.titleSection}>
            <h1>
              {modelData?.is_singleton
                ? modelData.friendly_name
                : `Edit ${displayName}`}
            </h1>
            <StatusBadge status={currentStatus} isSaving={isSaving} />
          </div>
        </div>

        <div className={s.headerActions}>
          {currentStatus === "changed" && (
            <Button
              variant="secondary"
              onClick={handleDiscard}
              disabled={loading || isSaving}
            >
              Discard Changes
            </Button>
          )}

          <div className={s.splitButton}>
            <Button
              type="submit"
              form="record-form"
              isLoading={loading}
              disabled={loading}
              className={s.mainAction}
            >
              {!modelData?.has_draft_mode
                ? "Save"
                : currentStatus === "draft"
                  ? "Publish"
                  : "Publish Changes"}
            </Button>

            <ContextMenu>
              <ContextMenu.Trigger>
                <Button
                  variant="primary"
                  className={s.caretButton}
                  disabled={loading}
                >
                  <span className={s.caret}>
                    <SvgIcon icon="chevron-down" size={16} />
                  </span>
                </Button>
              </ContextMenu.Trigger>
              <ContextMenu.Content>
                {currentStatus !== "draft" && (
                  <ContextMenu.Item
                    onSelect={handleUnpublish}
                    icon={<SvgIcon icon="eye-off" size={16} />}
                  >
                    Unpublish
                  </ContextMenu.Item>
                )}
                <ContextMenu.Item
                  variant="danger"
                  onSelect={handleDelete}
                  icon={<SvgIcon icon="trash-2" size={16} />}
                >
                  Delete Record
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu>
          </div>
        </div>
      </header>

      {error && <p className={s.error}>{error}</p>}

      {workingData && (
        <RecordForm
          id="record-form"
          model={model}
          initialData={workingData || undefined}
          onSubmit={handlePublish}
          onAutoSave={handleAutoSave}
          isLoading={loading}
          hasDraftMode={modelData?.has_draft_mode}
        />
      )}
    </div>
  )
}
