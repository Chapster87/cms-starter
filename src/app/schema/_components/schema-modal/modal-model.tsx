"use client"

import { useState, useEffect } from "react"
import { Settings, Eye } from "lucide-react"
import * as Tabs from "@radix-ui/react-tabs"
import Button from "@/components/button"
import { toast } from "@/client/toast-store"
import { useAuth } from "@/hooks/use-auth"
import { useModels } from "@/hooks/use-models"
import ModelBasicSettings from "./_components/model-basic-settings"
import ModelPreviewSettings from "./_components/model-preview-settings"
import s from "./style.module.css"

interface ModalModelProps {
  mode: "create" | "edit" | "duplicate"
  modelSlug?: string | null
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Form component for creating, editing, or duplicating a model (registry entry).
 */
export default function ModalModel({
  mode,
  modelSlug,
  onSuccess,
  onCancel,
}: ModalModelProps) {
  const { accessToken } = useAuth()
  const { models, refresh } = useModels()

  const [modelName, setModelName] = useState("")
  const [friendlyName, setFriendlyName] = useState("")
  const [groupId, setGroupId] = useState<string | null>(null)
  const [emoji, setEmoji] = useState("")
  const [showPicker, setShowPicker] = useState(false)
  const [isSingleton, setIsSingleton] = useState(false)
  const [hasDraftMode, setHasDraftMode] = useState(true)
  const [previewColumns, setPreviewColumns] = useState<string[]>([])
  const [subtitleColumn, setSubtitleColumn] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIdTouched, setIsIdTouched] = useState(false)

  useEffect(() => {
    // Use setTimeout to move state updates out of the synchronous render cycle
    // to avoid cascading render warnings and performance issues.
    const timer = setTimeout(() => {
      if ((mode === "edit" || mode === "duplicate") && modelSlug) {
        const existing = models.find((m) => m.slug === modelSlug)
        if (existing) {
          if (mode === "edit") {
            setModelName(existing.table_name)
            setFriendlyName(existing.friendly_name)
            setGroupId(existing.group_id || null)
            setEmoji(existing.emoji || "")
            setIsSingleton(existing.is_singleton)
            setHasDraftMode(existing.has_draft_mode || false)
            setPreviewColumns(existing.preview_columns || [])
            setSubtitleColumn(existing.subtitle_column || null)
            setIsIdTouched(true)
          } else {
            // Duplicate mode
            setModelName(`${existing.table_name}_copy`)
            setFriendlyName(`${existing.friendly_name} (Copy)`)
            setGroupId(existing.group_id || null)
            setEmoji(existing.emoji || "")
            setIsSingleton(existing.is_singleton)
            setHasDraftMode(existing.has_draft_mode || false)
            setPreviewColumns(existing.preview_columns || [])
            setSubtitleColumn(existing.subtitle_column || null)
            setIsIdTouched(true)
          }
        }
      } else {
        setModelName("")
        setFriendlyName("")
        setIsSingleton(false)
        setHasDraftMode(true)
        setIsIdTouched(false)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [mode, modelSlug, models])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    setIsSaving(true)
    setError(null)

    try {
      const isEdit = mode === "edit"
      const url = "/api/models"
      const method = isEdit ? "PATCH" : "POST"

      const body = isEdit
        ? {
            table_name: modelName,
            friendly_name: friendlyName || modelName,
            is_singleton: isSingleton,
            has_draft_mode: hasDraftMode,
            emoji: emoji || null,
            group_id: groupId,
            preview_columns: previewColumns,
            subtitle_column: subtitleColumn,
          }
        : {
            name: modelName,
            friendly_name: friendlyName || modelName,
            is_singleton: isSingleton,
            has_draft_mode: hasDraftMode,
            emoji: emoji || null,
            group_id: groupId,
            preview_columns: previewColumns,
            subtitle_column: subtitleColumn,
          }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || `Failed to ${mode} model`)
      }

      await refresh()
      toast.success(
        `Model ${mode === "edit" ? "updated" : mode === "duplicate" ? "duplicated" : "created"}`,
        `Model "${friendlyName}" is now available.`
      )
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${mode} model`
      setError(msg)
      toast.error("Error saving model", msg)
    } finally {
      setIsSaving(false)
    }
  }

  const { models: allModels } = useModels()
  const [availableFields, setAvailableFields] = useState<
    { slug: string; field_label: string }[]
  >([])

  useEffect(() => {
    const fetchFields = async () => {
      if (mode === "edit" && modelSlug) {
        const model = allModels.find((m) => m.slug === modelSlug)
        if (model) {
          try {
            const response = await fetch(
              `/api/models/schema/fields?table=${model.slug}`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            )
            if (response.ok) {
              const fields = await response.json()
              setAvailableFields(fields)
            }
          } catch (err) {
            console.error("Error fetching fields for preview selection:", err)
          }
        }
      }
    }
    fetchFields()
  }, [mode, modelSlug, allModels, accessToken])

  return (
    <form onSubmit={handleSubmit} className={s.modalForm}>
      {error && <p className={s.errorText}>{error}</p>}

      <Tabs.Root defaultValue="basic" className={s.tabsRoot}>
        <Tabs.List className={s.tabsList}>
          <Tabs.Trigger value="basic" className={s.tabsTrigger}>
            <Settings size={14} style={{ marginRight: "8px" }} /> Basic
          </Tabs.Trigger>
          {mode === "edit" && availableFields.length > 0 && (
            <Tabs.Trigger value="preview" className={s.tabsTrigger}>
              <Eye size={14} style={{ marginRight: "8px" }} /> Preview Settings
            </Tabs.Trigger>
          )}
        </Tabs.List>

        <Tabs.Content value="basic" className={s.tabsContent}>
          <ModelBasicSettings
            mode={mode}
            friendlyName={friendlyName}
            setFriendlyName={setFriendlyName}
            modelName={modelName}
            setModelName={setModelName}
            emoji={emoji}
            setEmoji={setEmoji}
            showPicker={showPicker}
            setShowPicker={setShowPicker}
            isSingleton={isSingleton}
            setIsSingleton={setIsSingleton}
            hasDraftMode={hasDraftMode}
            setHasDraftMode={setHasDraftMode}
            isIdTouched={isIdTouched}
            setIsIdTouched={setIsIdTouched}
            isSaving={isSaving}
          />
        </Tabs.Content>

        {mode === "edit" && availableFields.length > 0 && (
          <Tabs.Content value="preview" className={s.tabsContent}>
            <ModelPreviewSettings
              availableFields={availableFields}
              previewColumns={previewColumns}
              setPreviewColumns={setPreviewColumns}
              subtitleColumn={subtitleColumn}
              setSubtitleColumn={setSubtitleColumn}
              isSaving={isSaving}
            />
          </Tabs.Content>
        )}
      </Tabs.Root>

      <div className={s.modalActions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSaving} disabled={isSaving}>
          {mode === "edit" ? "Update Model" : "Create Model"}
        </Button>
      </div>
    </form>
  )
}
