"use client"

import { useRef, useEffect } from "react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import Button from "@/components/button"
import { CheckboxField, SlugField } from "@/components/fields"
import s from "../style.module.css"

interface ModelBasicSettingsProps {
  friendlyName: string
  setFriendlyName: (val: string) => void
  modelName: string
  setModelName: (val: string) => void
  emoji: string
  setEmoji: (val: string) => void
  showPicker: boolean
  setShowPicker: (val: boolean) => void
  isSingleton: boolean
  setIsSingleton: (val: boolean) => void
  hasDraftMode: boolean
  setHasDraftMode: (val: boolean) => void
  isIdTouched: boolean
  setIsIdTouched: (val: boolean) => void
  isSaving: boolean
  mode: "create" | "edit" | "duplicate"
}

export default function ModelBasicSettings({
  friendlyName,
  setFriendlyName,
  modelName,
  setModelName,
  emoji,
  setEmoji,
  showPicker,
  setShowPicker,
  isSingleton,
  setIsSingleton,
  hasDraftMode,
  setHasDraftMode,
  isIdTouched,
  setIsIdTouched,
  isSaving,
  mode,
}: ModelBasicSettingsProps) {
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
  }, [setShowPicker])

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setEmoji(emojiData.emoji)
    setShowPicker(false)
  }

  return (
    <>
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
            onChange={(e) => setFriendlyName(e.target.value)}
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

      <CheckboxField
        label="Enable Draft/Publish"
        checked={hasDraftMode}
        onChange={setHasDraftMode}
        disabled={isSaving}
        description="Check this if you want to manage record visibility with Draft and Published statuses."
        variant="switch"
      />
    </>
  )
}
