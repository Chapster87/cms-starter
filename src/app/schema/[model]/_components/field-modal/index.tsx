"use client"

import { useState, useEffect } from "react"
import { TextField, SelectField, CheckboxField } from "@/components/fields"
import Modal from "@/components/modal"
import { CMSField } from "@/types/fields"
import { FIELD_DEFINITIONS } from "@/utils/field-types"
import s from "./style.module.css"

interface FieldModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  modelId: string
  accessToken: string | null
  field?: CMSField | null // If present, we are in edit or duplicate mode
  mode?: "create" | "edit" | "duplicate"
}

/**
 * A reusable modal for creating, editing, and duplicating model fields.
 */
export default function FieldModal({
  isOpen,
  onOpenChange,
  onSuccess,
  modelId,
  accessToken,
  field,
  mode = "create",
}: FieldModalProps) {
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState(FIELD_DEFINITIONS[0].type)
  const [isRequired, setIsRequired] = useState(false)
  const [isUnique, setIsUnique] = useState(false)
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to move state updates out of the synchronous render cycle
      // resolving cascading render warnings from ESLint/Next.js
      const timer = setTimeout(() => {
        if (field) {
          if (mode === "edit") {
            setLabel(field.field_label)
            setName(field.field_name)
            setType(field.field_type)
            setIsRequired(field.is_required)
            setIsUnique(field.is_unique)
            setNote(field.field_note || "")
          } else if (mode === "duplicate") {
            setLabel(`${field.field_label} (copy)`)
            setName(`${field.field_name}_copy`)
            setType(field.field_type)
            setIsRequired(field.is_required)
            setIsUnique(field.is_unique)
            setNote(field.field_note || "")
          }
        } else {
          // Reset for new field
          setLabel("")
          setName("")
          setType(FIELD_DEFINITIONS[0].type)
          setIsRequired(false)
          setIsUnique(false)
          setNote("")
        }
        setError(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, field, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    setIsSaving(true)
    setError(null)

    try {
      const isEdit = mode === "edit"
      const url = "/api/models/schema/fields"
      const method = isEdit ? "PATCH" : "POST"

      const body = isEdit
        ? {
            id: field?.id,
            field_label: label,
            field_note: note,
            is_required: isRequired,
            is_unique: isUnique,
          }
        : {
            model_id: modelId,
            field_name: name || label.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            field_label: label,
            field_type: type,
            is_required: isRequired,
            is_unique: isUnique,
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
        throw new Error(result.error || `Failed to ${mode} field`)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${mode} field`)
    } finally {
      setIsSaving(true) // Keep it true until modal closes to prevent double clicks
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  const title =
    mode === "edit"
      ? "Edit Field"
      : mode === "duplicate"
        ? "Duplicate Field"
        : "Add New Field"
  const description =
    mode === "edit"
      ? "Update the configuration for this field."
      : "Define the attributes for this field."

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
          label="Field Label"
          placeholder="e.g. Featured Image"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          description="Human-friendly name for the field."
        />

        {mode !== "edit" && (
          <>
            <TextField
              label="Field Name (Database Column)"
              placeholder="e.g. featured_image"
              value={name}
              onChange={(e) => setName(e.target.value)}
              description="The physical column name in your database."
            />

            <SelectField
              label="Field Type"
              value={type}
              onChange={(val) => setType(val as CMSField["field_type"])}
              options={FIELD_DEFINITIONS.map((def) => ({
                value: def.type,
                label: `${def.label} - ${def.description}`,
              }))}
            />
          </>
        )}

        {mode === "edit" && (
          <TextField
            label="Field Note"
            placeholder="e.g. This image is used on the home page."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            description="Internal description or help text for editors."
          />
        )}

        <CheckboxField
          label="Required Field"
          checked={isRequired}
          onChange={setIsRequired}
          description="Make this field mandatory."
          variant="switch"
        />

        <CheckboxField
          label="Unique Constraint"
          checked={isUnique}
          onChange={setIsUnique}
          description="Prevent duplicate values in this column."
          variant="switch"
        />

        <div className={s.modalActions}>
          <button
            type="button"
            className={s.cancelButton}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button type="submit" className={s.saveButton} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : mode === "edit"
                ? "Update Field"
                : mode === "duplicate"
                  ? "Create Duplicate"
                  : "Create Field"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
