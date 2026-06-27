"use client"

import { useState, useEffect } from "react"
import Button from "@/components/button"
import { TextField, CheckboxField } from "@/components/fields"
import Modal from "@/components/modal"
import { CMSFieldset } from "@/types/fields"

import s from "./style.module.css"

interface FieldsetModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  modelId: string
  accessToken: string | null
  fieldset?: CMSFieldset | null
  mode?: "create" | "edit"
}

/**
 * Modal for creating and editing fieldsets.
 */
export default function FieldsetModal({
  isOpen,
  onOpenChange,
  onSuccess,
  modelId,
  accessToken,
  fieldset,
  mode = "create",
}: FieldsetModalProps) {
  const [label, setLabel] = useState("")
  const [defaultOpen, setDefaultOpen] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to move state updates out of the synchronous render cycle
      // resolving cascading render warnings from ESLint/Next.js
      const timer = setTimeout(() => {
        if (fieldset && mode === "edit") {
          setLabel(fieldset.label)
          setDefaultOpen(fieldset.settings?.default_open ?? true)
        } else {
          setLabel("")
          setDefaultOpen(true)
        }
        setError(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, fieldset, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    setIsSaving(true)
    setError(null)

    try {
      const isEdit = mode === "edit"
      const url = "/api/models/schema/fieldsets"
      const method = isEdit ? "PATCH" : "POST"

      const body = isEdit
        ? {
            id: fieldset?.id,
            label,
            settings: { ...fieldset?.settings, default_open: defaultOpen },
          }
        : {
            model_id: modelId,
            label,
            settings: { default_open: defaultOpen },
          }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${mode} fieldset`)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : `Failed to ${mode} fieldset`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const title = mode === "edit" ? "Edit Fieldset" : "Add New Fieldset"
  const description =
    mode === "edit"
      ? "Update the configuration for this grouping."
      : "Create a new group to organize your fields."

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      {error && <p className={s.errorText}>{error}</p>}

      <form onSubmit={handleSubmit} className={s.modalForm}>
        <TextField
          label="Group Label"
          placeholder="e.g. Hero Content"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          description="Name for the group displayed in the editor."
        />

        <CheckboxField
          label="Default Open"
          checked={defaultOpen}
          onChange={setDefaultOpen}
          description="Whether the accordion should be expanded by default."
          variant="switch"
        />

        <div className={s.modalActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={isSaving}>
            {mode === "edit" ? "Update Fieldset" : "Create Fieldset"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
