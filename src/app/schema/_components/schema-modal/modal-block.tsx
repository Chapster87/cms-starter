"use client"

import { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"

import Button from "@/components/button"
import TextField from "@/components/fields/text-field"
import { toast } from "@/client/toast-store"
import { useAuth } from "@/hooks/use-auth"
import { useBlocks } from "@/hooks/use-blocks"

import s from "./style.module.css"

interface BlockFormData {
  label: string
  api_id: string
  emoji: string
  description: string
}

interface ModalBlockProps {
  mode: "create" | "edit"
  blockId?: string | null
  onSuccess: () => void
  onCancel: () => void
}

export default function ModalBlock({
  mode,
  blockId,
  onSuccess,
  onCancel,
}: ModalBlockProps) {
  const { accessToken } = useAuth()
  const { refresh, blocks } = useBlocks()

  const isEditing = mode === "edit"

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [emojiValue, setEmojiValue] = useState("")
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BlockFormData>()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isEditing && blockId && blocks.length > 0) {
        const block = blocks.find((b) => b.id === blockId)
        if (block) {
          const initialEmoji = block.emoji || ""
          reset({
            label: block.label,
            api_id: block.api_id,
            emoji: initialEmoji,
            description: block.description || "",
          })
          setEmojiValue(initialEmoji)
        }
      } else {
        reset({ label: "", api_id: "", emoji: "", description: "" })
        setEmojiValue("")
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [isEditing, blockId, blocks, reset])

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setValue("emoji", emojiData.emoji)
    setEmojiValue(emojiData.emoji)
    setShowPicker(false)
  }

  const onSubmit = async (data: BlockFormData) => {
    setIsSubmitting(true)
    try {
      const url = isEditing ? `/api/blocks?id=${blockId}` : "/api/blocks"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save block")
      }

      toast.success(isEditing ? "Block updated" : "Block created")
      refresh()
      onSuccess()
    } catch (err: unknown) {
      toast.error(
        "Save failed",
        err instanceof Error ? err.message : "Failed to save block"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={s.modalForm}>
      <div className={s.nameFieldSection}>
        <label className={s.fieldLabel}>Block Label</label>
        <div className={s.nameInputRow}>
          <div className={s.emojiFieldWrapper}>
            <Button
              variant="secondary"
              unstyled
              type="button"
              className={s.emojiButton}
              onClick={() => setShowPicker(!showPicker)}
            >
              {emojiValue || "⬚"}
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
            placeholder="e.g. Hero Section"
            {...register("label", {
              required: "Label is required",
              onChange: (e) => {
                if (!isEditing) {
                  const val = e.target.value
                  const slug = val
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "_")
                    .replace(/(^_|_$)/g, "")
                  setValue("api_id", slug)
                }
              },
            })}
            className={s.nameInput}
          />
        </div>
        {errors.label && <p className={s.errorText}>{errors.label.message}</p>}
      </div>

      <TextField
        label="API ID"
        placeholder="e.g. hero_section"
        {...register("api_id", { required: "API ID is required" })}
        error={errors.api_id?.message}
        description="Used to identify the block in the API and code."
      />

      <TextField
        label="Description"
        placeholder="Describe what this block is for..."
        {...register("description")}
        error={errors.description?.message}
      />

      <div className={s.modalActions}>
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? "Save Changes" : "Create Block"}
        </Button>
      </div>
    </form>
  )
}
