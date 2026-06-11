"use client"

import React, { useState, useEffect, useRef } from "react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import Button from "@/components/button"
import { toast } from "@/client/toast-store"
import { useAuth } from "@/hooks/use-auth"
import { useModels } from "@/hooks/use-models"
import s from "./style.module.css"

interface ModalModelGroupProps {
  mode: "create" | "edit"
  groupId?: string | null
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Form component for creating or editing a model group (folder).
 */
export default function ModalModelGroup({
  mode,
  groupId,
  onSuccess,
  onCancel,
}: ModalModelGroupProps) {
  const { accessToken } = useAuth()
  const { groups, refresh } = useModels()

  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("📁")
  const [showPicker, setShowPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const editingGroup = groupId ? groups.find((g) => g.id === groupId) : null

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
    const timer = setTimeout(() => {
      if (editingGroup && mode === "edit") {
        setName(editingGroup.name)
        setEmoji(editingGroup.emoji || "📁")
      } else {
        setName("")
        setEmoji("📁")
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [editingGroup, mode])

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setEmoji(emojiData.emoji)
    setShowPicker(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Group name is required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const isEdit = mode === "edit"
      const url = "/api/models/groups"
      const method = isEdit ? "PATCH" : "POST"

      const body = isEdit
        ? { id: groupId, name, emoji, type: editingGroup?.type || null }
        : { name, emoji, type: null }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save group")
      }

      await refresh()
      toast.success(
        `Group ${mode === "edit" ? "updated" : "created"}`,
        `Group "${name}" is now available.`
      )
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save group"
      setError(msg)
      toast.error("Error saving group", msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={s.modalForm}>
      {error && <p className={s.errorText}>{error}</p>}

      <div className={s.nameFieldSection}>
        <label className={s.fieldLabel}>Group Name</label>
        <div className={s.nameInputRow}>
          <div className={s.emojiFieldWrapper}>
            <Button
              variant="secondary"
              unstyled
              type="button"
              className={s.emojiButton}
              onClick={() => setShowPicker(!showPicker)}
              disabled={isLoading}
            >
              {emoji || "📁"}
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
            placeholder="e.g. Content, Marketing, Settings"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={s.nameInput}
            disabled={isLoading}
            required
            autoFocus
          />
        </div>
        <p className={s.fieldDescription}>
          Folders help organize your models in the sidebar and dashboard.
        </p>
      </div>

      <div className={s.modalActions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {mode === "edit" ? "Update Group" : "Create Group"}
        </Button>
      </div>
    </form>
  )
}
