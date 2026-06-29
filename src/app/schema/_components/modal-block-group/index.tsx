"use client"

import { useState, useEffect, useRef } from "react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import Button from "@/components/button"
import { useAuth } from "@/hooks/use-auth"
import { useBlockGroups } from "@/hooks/use-block-groups"
import s from "./style.module.css"

interface ModalBlockGroupProps {
  mode: "create" | "edit"
  groupId?: string | null
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Form component for creating or editing a block group (folder).
 * Matches ModalModelGroup implementation exactly.
 */
export default function ModalBlockGroup({
  mode,
  groupId,
  onSuccess,
  onCancel,
}: ModalBlockGroupProps) {
  const { accessToken } = useAuth()
  const { groups, refresh } = useBlockGroups()

  const editingGroup = groupId ? groups.find((g) => g.id === groupId) : null

  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("📁")
  const [showPicker, setShowPicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

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
      const url = "/api/blocks/groups"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: isEdit ? groupId : undefined,
          name,
          emoji,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save block group")
      }
      refresh()
      onSuccess()
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to save block group"
      )
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
            placeholder="e.g. Hero Sections"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={s.nameInput}
            disabled={isLoading}
            required
            autoFocus
          />
        </div>
        <p className={s.fieldDescription}>
          Folders help organize your blocks in the sidebar.
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
