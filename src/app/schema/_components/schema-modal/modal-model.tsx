"use client"

import { useState, useEffect, useRef } from "react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import Button from "@/components/button"
import { CheckboxField, SlugField } from "@/components/fields"
import { toast } from "@/client/toast-store"
import { useAuth } from "@/hooks/use-auth"
import { useModels } from "@/hooks/use-models"
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
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isIdTouched, setIsIdTouched] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
            setIsIdTouched(true)
          } else {
            // Duplicate mode
            setModelName(`${existing.table_name}_copy`)
            setFriendlyName(`${existing.friendly_name} (Copy)`)
            setGroupId(existing.group_id || null)
            setEmoji(existing.emoji || "")
            setIsSingleton(existing.is_singleton)
            setHasDraftMode(existing.has_draft_mode || false)
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

  const handleFriendlyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendlyName(e.target.value)
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setEmoji(emojiData.emoji)
    setShowPicker(false)
  }

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
          }
        : {
            name: modelName,
            friendly_name: friendlyName || modelName,
            is_singleton: isSingleton,
            has_draft_mode: hasDraftMode,
            emoji: emoji || null,
            group_id: groupId,
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

  const { groups } = useModels()

  return (
    <form onSubmit={handleSubmit} className={s.modalForm}>
      {error && <p className={s.errorText}>{error}</p>}

      <div className={s.nameFieldSection}>
        <label className={s.fieldLabel}>Display Name</label>
        <div className={s.nameInputRow}>
          <div className={s.emojiFieldWrapper}>
            <Button
              variant="secondary"
              unstyled
              type="button"
              className={s.emojiButton}
              onClick={() => setShowPicker(!showPicker)}
              disabled={isSaving}
            >
              {emoji || "⬚"}
            </Button>
            {showPicker && (
              <div className={s.pickerContainer} ref={pickerRef}>
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                />
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="e.g. Article"
            value={friendlyName}
            onChange={handleFriendlyNameChange}
            className={s.nameInput}
            disabled={isSaving}
            required
          />
        </div>
        <p className={s.fieldDescription}>
          Human-friendly label used in the CMS. Please write it down in
          singular.
        </p>
      </div>

      <SlugField
        label="Model ID (Database Table)"
        placeholder="e.g. blog_posts"
        value={modelName}
        sourceValue={friendlyName}
        onChange={setModelName}
        isTouched={isIdTouched}
        onToggleTouched={setIsIdTouched}
        disabled={isSaving || mode === "edit"}
        required
        description="Lowercase, no spaces. This will be the physical table name."
      />

      {/* <div className={s.fieldSection}>
        <label className={s.fieldLabel}>Group / Folder</label>
        <select
          className={s.selectField}
          value={groupId || ""}
          onChange={(e) => setGroupId(e.target.value || null)}
          disabled={isSaving}
        >
          <option value="">(No Group)</option>
          {groups
            .filter((g) => g.type === "schema")
            .map((group) => (
              <option key={group.id} value={group.id}>
                {group.emoji} {group.name}
              </option>
            ))}
        </select>
        <p className={s.fieldDescription}>Organize this model into a folder.</p>
      </div> */}

      <CheckboxField
        label="Is Singleton"
        checked={isSingleton}
        onChange={setIsSingleton}
        disabled={isSaving}
        description="Check this if the model should only ever have one record (e.g., Global Settings)."
        variant="switch"
      />

      <CheckboxField
        label="Enable Draft/Publish"
        checked={hasDraftMode}
        onChange={setHasDraftMode}
        disabled={isSaving}
        description="Check this if you want to manage record visibility with Draft and Published statuses."
        variant="switch"
      />

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
