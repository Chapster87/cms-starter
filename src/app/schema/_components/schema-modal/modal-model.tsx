"use client"

import { useState, useEffect, useRef } from "react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import { TextField, CheckboxField, SlugField } from "@/components/fields"
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
  const [emoji, setEmoji] = useState("")
  const [showPicker, setShowPicker] = useState(false)
  const [isSingleton, setIsSingleton] = useState(false)
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
            setEmoji(existing.emoji || "")
            setIsSingleton(existing.is_singleton)
            setIsIdTouched(true)
          } else {
            // Duplicate mode
            setModelName(`${existing.table_name}_copy`)
            setFriendlyName(`${existing.friendly_name} (Copy)`)
            setEmoji(existing.emoji || "")
            setIsSingleton(existing.is_singleton)
            setIsIdTouched(true)
          }
        }
      } else {
        setModelName("")
        setFriendlyName("")
        setIsSingleton(false)
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
            emoji: emoji || null,
          }
        : {
            name: modelName,
            friendly_name: friendlyName || modelName,
            is_singleton: isSingleton,
            emoji: emoji || null,
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
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} model`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={s.modalForm}>
      {error && <p className={s.errorText}>{error}</p>}

      <div className={s.nameFieldSection}>
        <label className={s.fieldLabel}>Display Name</label>
        <div className={s.nameInputRow}>
          <div className={s.emojiFieldWrapper}>
            <button
              type="button"
              className={s.emojiButton}
              onClick={() => setShowPicker(!showPicker)}
              disabled={isSaving}
            >
              {emoji || "⬚"}
            </button>
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

      <CheckboxField
        label="Is Singleton"
        checked={isSingleton}
        onChange={setIsSingleton}
        disabled={isSaving}
        description="Check this if the model should only ever have one record (e.g., Global Settings)."
        variant="switch"
      />

      <div className={s.modalActions}>
        <button
          type="button"
          className={s.cancelButton}
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button type="submit" className={s.saveButton} disabled={isSaving}>
          {isSaving
            ? "Saving..."
            : mode === "edit"
              ? "Update Model"
              : "Create Model"}
        </button>
      </div>
    </form>
  )
}
