"use client"

import { useState, useEffect, useCallback, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { dataService, RecordBase } from "@/client/data-service"
import Button from "@/components/button"
import ContextMenu from "@/components/context-menu"
import SvgIcon from "@/components/svg-icon"
import { useAuth } from "@/hooks/use-auth"
import { useModels } from "@/hooks/use-models"
import RecordForm from "@/app/editor/[model]/_components/record-form"
import StatusBadge, {
  RecordStatus,
} from "@/app/editor/[model]/_components/status-badge"
import s from "./style.module.css"

interface EditRecordPageProps {
  params: Promise<{
    model: string | undefined
    id: string | undefined
  }>
}

/**
 * Renders the page for editing an existing record.
 * Supports both UUID and Slug-based lookups.
 */
export default function EditRecordPage({ params }: EditRecordPageProps) {
  const router = useRouter()
  const { model, id } = use(params)
  const { accessToken, loading: authLoading } = useAuth()
  const { models } = useModels()

  const modelData = models.find((m) => m.slug === model)

  const [record, setRecord] = useState<RecordBase | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const loadRecord = useCallback(async () => {
    if (!model || !id) return

    setLoading(true)
    setError(null)
    try {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        )

      let data = null

      if (isUuid) {
        // If it looks like a UUID, try ID first to avoid noisy 400 errors if 'slug' doesn't exist
        data = await dataService.getRecordById(model, id)
        if (!data) {
          data = await dataService.getRecordBySlug(model, id)
        }
      } else {
        // If not a UUID, it must be a slug
        data = await dataService.getRecordBySlug(model, id)
        if (!data) {
          data = await dataService.getRecordById(model, id)
        }
      }

      if (!data) {
        setError("Record not found.")
      } else {
        setRecord(data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading record")
    } finally {
      setLoading(false)
    }
  }, [model, id])

  useEffect(() => {
    if (!authLoading && accessToken) {
      const timer = setTimeout(() => {
        loadRecord()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [loadRecord, authLoading, accessToken])

  const handleAutoSave = useCallback(
    (formData: Record<string, unknown>) => {
      if (!model || !record?.id) return

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(async () => {
        setIsSaving(true)
        try {
          await dataService.autoSaveRecord(model, record.id, formData)
          // Optimistically update local record state to show "Changed" status immediately
          setRecord((prev) => (prev ? { ...prev, _draft: formData } : prev))
        } catch (err) {
          console.error("Auto-save failed:", err)
        } finally {
          setIsSaving(false)
        }
      }, 2000)
    },
    [model, record]
  )

  const handlePublish = async (formData: Record<string, unknown>) => {
    if (!model || !record?.id) return

    setLoading(true)
    setError(null)
    try {
      await dataService.publishRecord(model, record.id, formData)
      setSuccess("Record published successfully!")
      await loadRecord()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish record")
    } finally {
      setLoading(false)
    }
  }

  const handleDiscard = async () => {
    if (!model || !record?.id) return
    if (!confirm("Are you sure you want to discard all unpublished changes?"))
      return

    setLoading(true)
    try {
      await dataService.discardChanges(model, record.id)
      await loadRecord()
      setSuccess("Changes discarded.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to discard changes")
    } finally {
      setLoading(false)
    }
  }

  const handleUnpublish = async () => {
    if (!model || !record?.id) return
    if (
      !confirm(
        "Are you sure you want to unpublish this record? It will no longer be visible on the live site."
      )
    )
      return

    setLoading(true)
    try {
      await dataService.unpublishRecord(model, record.id)
      await loadRecord()
      setSuccess("Record unpublished.")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to unpublish record"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!model || !record?.id) return
    if (
      !confirm(
        "Are you sure you want to delete this record? This action cannot be undone."
      )
    )
      return

    setLoading(true)
    try {
      await dataService.deleteRecord(model, record.id)
      router.push(`/editor/${model}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete record")
    } finally {
      setLoading(false)
    }
  }

  if (loading || authLoading) return <p>Loading record...</p>
  if (!model || !id) return <p>Invalid parameters.</p>

  const currentStatus: RecordStatus =
    record?.status === "published"
      ? record?._draft
        ? "changed"
        : "published"
      : "draft"

  // For the form, we want to show the draft data if it exists, otherwise the main record data
  const workingData = record?._draft
    ? { ...record, ...(record._draft as object) }
    : record

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
            <h1>Edit {model}</h1>
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
              {currentStatus === "draft" ? "Publish" : "Publish Changes"}
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
      {success && <p className={s.success}>{success}</p>}

      {record && (
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
